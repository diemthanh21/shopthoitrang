const theThanhVienRepo = require('../repositories/thethanhvien.repository');
const hangTheRepo = require('../repositories/hangthe.repository');
const loyaltyRepo = require('../repositories/tichluy_chitieu.repository');
const membershipSnapshotRepo = require('../repositories/membership_order_snapshot.repository');
const supabase = require('../../config/db');

const tierSortFn = (a, b) => {
  const aVal = Number(a?.dieukien_nam ?? 0);
  const bVal = Number(b?.dieukien_nam ?? 0);
  return aVal - bVal;
};

const addOneYear = (inputDate) => {
  const base = inputDate ? new Date(inputDate) : new Date();
  base.setFullYear(base.getFullYear() + 1);
  return base.toISOString();
};

const toTierSnapshot = (tier) => {
  if (!tier) return null;
  const source = tier.toJSON ? tier.toJSON() : tier;
  return {
    mahangthe: source.mahangthe ?? source.maHangThe ?? null,
    tenhang: source.tenhang ?? source.tenHang ?? null,
    dieukien_nam: Number(source.dieukien_nam ?? source.dieuKienNam ?? 0),
    dieukien_tichluy: Number(source.dieukien_tichluy ?? source.dieuKienTichLuy ?? 0),
    giamgia: Number(source.giamgia ?? source.giamGia ?? 0),
    voucher_sinhnhat: Number(source.voucher_sinhnhat ?? source.voucherSinhNhat ?? 0),
    uudai: source.uudai ?? source.uuDai ?? null,
  };
};

async function getSortedTiers() {
  const tiers = await hangTheRepo.getAll();
  return tiers.sort(tierSortFn);
}

async function ensureDefaultCard(makhachhang) {
  const existing = await theThanhVienRepo.findLatestActiveByKhachHang(makhachhang);
  if (existing) return existing;

  const tiers = await getSortedTiers();
  if (!tiers.length) return null;

  const baseTier = tiers[0];
  const snapshot = toTierSnapshot(baseTier);
  const now = new Date().toISOString();
  return theThanhVienRepo.create({
    makhachhang,
    mahangthe: baseTier.mahangthe,
    ngaycap: now,
    ngayhethan: addOneYear(now),
    trangthai: true,
    tier_snapshot: snapshot,
    tichluy_khi_cap: 0
  });
}

async function getActiveCardWithTier(makhachhang) {
  let card = await theThanhVienRepo.findLatestActiveByKhachHang(makhachhang);
  if (!card) card = await ensureDefaultCard(makhachhang);
  if (!card) return null;

  const tier = card.maHangThe ? await hangTheRepo.getById(card.maHangThe) : null;
  return { card, tier };
}

async function getCardSummary(makhachhang) {
  const bundle = await getActiveCardWithTier(makhachhang);
  if (!bundle) return null;
  const { card, tier } = bundle;
  const json = card.toJSON();
  const tierSnapshot = json.tier_snapshot || toTierSnapshot(tier);
  return {
    ...json,
    tenhang: tierSnapshot?.tenhang || tier?.tenhang || null,
    giamgia: tierSnapshot?.giamgia ?? tier?.giamgia ?? 0,
    voucher_sinhnhat: tierSnapshot?.voucher_sinhnhat ?? tier?.voucher_sinhnhat ?? 0,
    uudai: tierSnapshot?.uudai ?? tier?.uudai ?? null
  };
}

async function getLoyaltySummary(makhachhang) {
  const now = new Date();
  const year = now.getFullYear();
  const currentYearRecord = await loyaltyRepo.findByCustomerAndYear(makhachhang, year);
  if (currentYearRecord) {
    return currentYearRecord.toJSON();
  }
  const latest = await loyaltyRepo.findLatestByCustomer(makhachhang);
  return {
    id: null,
    makh: makhachhang,
    nam: year,
    tongchi_nam: 0,
    tongchi_tichluy: latest?.tongChiTichLuy ?? 0,
    ngaycapnhat: latest?.ngayCapNhat ?? null
  };
}

async function computeOrderAmount(order) {
  const base = Number(order?.thanhtien ?? 0);
  if (base > 0) return base;
  try {
    const { data, error } = await supabase
      .from('chitietdonhang')
      .select('soluong, dongia')
      .eq('madonhang', order.madonhang);
    if (error || !data) return 0;
    return data.reduce((sum, row) => {
      const qty = Number(row.soluong ?? 0);
      const price = Number(row.dongia ?? 0);
      return sum + qty * price;
    }, 0);
  } catch {
    return 0;
  }
}

async function incrementLoyalty(makhachhang, amount, whenDate) {
  const year = new Date(whenDate).getFullYear();
  const current = await loyaltyRepo.findByCustomerAndYear(makhachhang, year);
  const nowIso = new Date().toISOString();

  if (current) {
    const updated = await loyaltyRepo.update(current.id, {
      tongchi_nam: Number(current.tongChiNam ?? current.tongchi_nam ?? 0) + amount,
      tongchi_tichluy: Number(current.tongChiTichLuy ?? current.tongchi_tichluy ?? 0) + amount,
      ngaycapnhat: nowIso
    });
    return updated;
  }

  const latest = await loyaltyRepo.findLatestByCustomer(makhachhang);
  const lifetimeBefore = Number(latest?.tongChiTichLuy ?? latest?.tongchi_tichluy ?? 0);
  return loyaltyRepo.create({
    makh: makhachhang,
    nam: year,
    tongchi_nam: amount,
    tongchi_tichluy: lifetimeBefore + amount,
    ngaycapnhat: nowIso
  });
}

async function maybeUpgradeTier(makhachhang, loyaltyRecord, activeCard) {
  const tiers = await getSortedTiers();
  if (!tiers.length || !activeCard) return activeCard;

  const currentIndex = Math.max(
    tiers.findIndex((tier) => tier.mahangthe === activeCard.maHangThe),
    0
  );

  const lifetime = Number(loyaltyRecord?.tongChiTichLuy ?? loyaltyRecord?.tongchi_tichluy ?? 0);
  const spentSinceTier = lifetime - Number(activeCard.tichLuyKhiCap || activeCard.tichluy_khi_cap || 0);
  const spentYear = Number(loyaltyRecord?.tongChiNam ?? loyaltyRecord?.tongchi_nam ?? 0);

  let targetIndex = currentIndex;
  tiers.forEach((tier, idx) => {
    const needYear = Number(tier.dieukien_nam ?? 0);
    const needAccum = Number(tier.dieukien_tichluy ?? 0);
    const qualifiesYear = needYear > 0 && spentYear >= needYear;
    const qualifiesAccum = needAccum > 0 && spentSinceTier >= needAccum;
    if ((qualifiesYear || qualifiesAccum) && idx > targetIndex) {
      targetIndex = idx;
    }
  });

  if (targetIndex === currentIndex) return activeCard;

  await theThanhVienRepo.deactivateAll(makhachhang);
  const newTier = tiers[targetIndex];
  const snapshot = toTierSnapshot(newTier);
  const issuedAt = new Date().toISOString();
  const newCard = await theThanhVienRepo.create({
    makhachhang,
    mahangthe: newTier.mahangthe,
    ngaycap: issuedAt,
    ngayhethan: addOneYear(issuedAt),
    trangthai: true,
    tier_snapshot: snapshot,
    tichluy_khi_cap: lifetime
  });
  return newCard;
}

async function recordOrderSpending(order) {
  if (!order || !order.makhachhang || !order.madonhang) return null;

  const existingSnapshot = await membershipSnapshotRepo.findByOrderId(order.madonhang);
  if (existingSnapshot) return existingSnapshot;

  const amount = await computeOrderAmount(order);
  if (!amount || amount <= 0) return null;

  const loyaltyRecord = await incrementLoyalty(
    order.makhachhang,
    amount,
    order.ngaygiaohang || new Date().toISOString()
  );

  const bundle = await getActiveCardWithTier(order.makhachhang);
  const card = bundle?.card;
  const tierSnapshot = card?.tierSnapshot || toTierSnapshot(bundle?.tier);

  if (tierSnapshot) {
    await membershipSnapshotRepo.create({
      madonhang: order.madonhang,
      makhachhang: order.makhachhang,
      tier_snapshot: tierSnapshot,
      chi_tieu_cong: amount
    });
  }

  if (card) {
    await maybeUpgradeTier(order.makhachhang, loyaltyRecord, card);
  }

  return loyaltyRecord;
}

module.exports = {
  ensureDefaultCard,
  getCardSummary,
  getLoyaltySummary,
  recordOrderSpending
};
