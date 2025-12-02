/**
 * Backfill approve points directly into legacy ledger table for delivered orders
 * Uses table: thethanhvien_point_ledger
 * - Only for orders with no existing EARN ledger rows
 * - Credits points immediately (status=APPROVED) because > 7 days
 *
 * Run:
 *   node scripts/backfill-approve-points-legacy-ledger.js
 */

require('dotenv').config();
const supabase = require('../config/db');
const cardRepo = require('../src/repositories/thethanhvien.repository');
const ledgerRepo = require('../src/repositories/thethanhvien_point_ledger.repository');
const membershipService = require('../src/services/membership.service');

const VND_PER_POINT = 100; // fallback same as service

function normalizeStatus(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase();
}

function calcPoints(amount) {
  if (!amount || isNaN(amount)) return 0;
  return Math.max(0, Math.floor(Number(amount) / VND_PER_POINT));
}

async function computeOrderAmount(order) {
  // Prefer thanhtien; else sum of items
  const base = Number(order?.thanhtien ?? 0);
  if (base > 0) return base;
  const { data, error } = await supabase
    .from('chitietdonhang')
    .select('soluong, dongia')
    .eq('madonhang', order.madonhang);
  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + Number(row.soluong || 0) * Number(row.dongia || 0), 0);
}

async function main() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 7);
  console.log('[BackfillLegacy] Cutoff <=', cutoff.toISOString());

  const { data: orders, error } = await supabase
    .from('donhang')
    .select('madonhang, makhachhang, thanhtien, trangthaidonhang, ngaygiaohang')
    .lte('ngaygiaohang', cutoff.toISOString())
    .order('ngaygiaohang', { ascending: true });
  if (error) throw error;

  console.log('[BackfillLegacy] Orders fetched:', (orders||[]).length);
  const deliveredOrders = (orders||[]).filter(o => {
    const status = normalizeStatus(o.trangthaidonhang);
    const delivered = status.includes('DA GIAO') || status.includes('HOAN THANH');
    if (!delivered) {
      console.log(`[Skip] Order #${o.madonhang} statusRaw='${o.trangthaidonhang}' norm='${status}'`);
    }
    return delivered;
  });
  console.log('[BackfillLegacy] Delivered candidates:', deliveredOrders.length);

  let processed = 0;
  let credited = 0;

  for (const o of deliveredOrders) {

    // Skip if already has any EARN ledger for this order
    const rows = await ledgerRepo.findPendingByOrder(o.madonhang); // pending only
    const { data: allRows } = await supabase
      .from('thethanhvien_point_ledger')
      .select('id')
      .eq('madonhang', o.madonhang)
      .eq('type', 'EARN')
      .limit(1);
    if (Array.isArray(allRows) && allRows.length > 0) continue;

    processed += 1;

    // Ensure card
    const card = await membershipService.ensureDefaultCard(o.makhachhang);

    const amount = await computeOrderAmount(o);
    const points = calcPoints(amount);
    if (!points) {
      console.log(`[BackfillLegacy] Order #${o.madonhang} amount=${amount} -> 0 points. Skipped`);
      continue;
    }

    // Update card balances
    await cardRepo.update(card.maThe, {
      diem_hien_tai: Number(card.diemHienTai || 0) + points,
      diem_nam_hien_tai: Number(card.diemNamHienTai || 0) + points,
      updated_at: new Date().toISOString()
    });

    // Write ledger (approved)
    const availableAt = new Date(o.ngaygiaohang || now);
    availableAt.setDate(availableAt.getDate() + 7);
    await ledgerRepo.create({
      mathe: card.maThe,
      makhachhang: o.makhachhang,
      madonhang: o.madonhang,
      type: 'EARN',
      diem: points,
      status: 'APPROVED',
      available_at: availableAt.toISOString(),
      released_at: new Date().toISOString(),
      note: `Tich diem backfill don #${o.madonhang}`,
    });
    credited += 1;
    console.log(`[BackfillLegacy] Credited ${points} pts to KH ${o.makhachhang} for order #${o.madonhang}`);
  }

  console.log(`[BackfillLegacy] Done. Processed=${processed}, Credited=${credited}`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
