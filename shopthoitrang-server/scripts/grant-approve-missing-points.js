require('dotenv').config();
const supabase = require('../config/db');
const membershipService = require('../src/services/membership.service');
const pointTxRepo = require('../src/repositories/point_transaction.repository');
const cardRepo = require('../src/repositories/thethanhvien.repository');

const VND_PER_POINT = 100;

function normalizeStatus(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase();
}

function calcPoints(amount){
  if (!amount || isNaN(amount)) return 0;
  return Math.max(0, Math.floor(Number(amount) / VND_PER_POINT));
}

async function computeOrderAmount(madonhang, thanhtien){
  if (Number(thanhtien) > 0) return Number(thanhtien);
  const { data } = await supabase
    .from('chitietdonhang')
    .select('soluong, dongia')
    .eq('madonhang', madonhang);
  return (data||[]).reduce((s,r)=> s + Number(r.soluong||0)*Number(r.dongia||0), 0);
}

async function hasApprovedOrPending(orderId){
  const rows = await pointTxRepo.findByOrder(orderId);
  return rows.some(r => r.type === 'EARN' && (r.status === 'APPROVED' || r.status === 'PENDING'));
}

async function main(){
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate()-7);
  console.log('[GrantApproveMissing] cutoff', cutoff.toISOString());

  const { data: orders } = await supabase
    .from('donhang')
    .select('madonhang, makhachhang, thanhtien, trangthaidonhang, ngaygiaohang')
    .lte('ngaygiaohang', cutoff.toISOString())
    .order('ngaygiaohang', { ascending: true });

  let approved = 0;

  for (const o of orders || []){
    const status = normalizeStatus(o.trangthaidonhang);
    const delivered = status.includes('DA GIAO') || status.includes('HOAN THANH');
    if (!delivered) continue;

    if (await hasApprovedOrPending(o.madonhang)) continue;

    const card = await membershipService.ensureDefaultCard(o.makhachhang);
    const amount = await computeOrderAmount(o.madonhang, o.thanhtien);
    const points = calcPoints(amount);
    if (!points) continue;

    // Increment card balances
    await cardRepo.update(card.maThe, {
      diem_hien_tai: Number(card.diemHienTai||0) + points,
      diem_nam_hien_tai: Number(card.diemNamHienTai||0) + points,
      updated_at: new Date().toISOString()
    });

    // Write APPROVED transaction
    const availableAt = new Date(o.ngaygiaohang || new Date());
    availableAt.setDate(availableAt.getDate()+7);
    await pointTxRepo.create({
      mathe: card.maThe,
      makhachhang: o.makhachhang,
      madonhang: o.madonhang,
      type: 'EARN',
      diem: points,
      status: 'APPROVED',
      available_at: availableAt.toISOString(),
      approved_at: new Date().toISOString(),
      note: `Duyet diem backfill don #${o.madonhang}`
    });

    approved += 1;
    console.log(`[GrantApproveMissing] Approved ${points} pts for order #${o.madonhang} (KH ${o.makhachhang})`);
  }

  console.log(`[GrantApproveMissing] Done. Approved ${approved} orders.`);
}

if (require.main === module){
  main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
}
