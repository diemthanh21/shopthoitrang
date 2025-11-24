const theThanhVienRepo = require('../repositories/thethanhvien.repository');
const hangTheRepo = require('../repositories/hangthe.repository');
const loyaltyRepo = require('../repositories/tichluy_chitieu.repository');
const membershipSnapshotRepo = require('../repositories/membership_order_snapshot.repository');
const pointTxRepo = require('../repositories/point_transaction.repository');
const supabase = require('../../config/db');

const tierSortFn = (a, b) => {
  const aVal = Number(a?.dieukien_nam ?? 0);
  const bVal = Number(b?.dieukien_nam ?? 0);
  return aVal - bVal;
};

const VND_PER_POINT = 100; // 1 điểm = 1% tổng tiền (100 VND = 1 điểm)
const PENDING_DAYS = 7; // Số ngày chờ để duyệt điểm

const addOneYear = (inputDate) => {
  const base = inputDate ? new Date(inputDate) : new Date();
  base.setFullYear(base.getFullYear() + 1);
  return base.toISOString();
};

const calculatePointsFromAmount = (amount) => {
  if (!amount || Number.isNaN(Number(amount))) return 0;
  return Math.max(0, Math.floor(Number(amount) / VND_PER_POINT));
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

  const now = new Date().toISOString();
  const currentYear = new Date().getFullYear();
  
  return theThanhVienRepo.create({
    makhachhang,
    ngaycap: now,
    trangthai: true,
    diem_hien_tai: 0,
    diem_pending: 0,
    diem_nam_hien_tai: 0,
    nam_diem: currentYear,
    last_reset_at: now,
  });
}

async function getActiveCardWithTier(makhachhang) {
  let card = await theThanhVienRepo.findLatestActiveByKhachHang(makhachhang);
  if (!card) card = await ensureDefaultCard(makhachhang);
  if (!card) return null;

  // Database V2: không còn mahangthe, tier được tính động dựa trên diem_nam_hien_tai
  return { card, tier: null };
}

async function ensurePointsYear(card) {
  const currentYear = new Date().getFullYear();
  if (Number(card.namDiem) === currentYear) return card;
  const updated = await theThanhVienRepo.update(card.maThe, {
    nam_diem: currentYear,
    diem_nam_hien_tai: 0,
    last_reset_at: new Date().toISOString(),
  });
  return updated || card;
}

async function applyPointDelta(card, { deltaActive = 0, deltaPending = 0, deltaYear = 0 }) {
  const payload = {};
  let mutated = false;
  if (deltaActive) {
    card.diemHienTai = Math.max(0, Number(card.diemHienTai || 0) + deltaActive);
    payload.diem_hien_tai = card.diemHienTai;
    mutated = true;
  }
  if (deltaPending) {
    card.diemPending = Math.max(0, Number(card.diemPending || 0) + deltaPending);
    payload.diem_pending = card.diemPending;
    mutated = true;
  }
  if (deltaYear) {
    card.diemNamHienTai = Math.max(0, Number(card.diemNamHienTai || 0) + deltaYear);
    payload.diem_nam_hien_tai = card.diemNamHienTai;
    mutated = true;
  }
  if (!mutated) return card;
  payload.updated_at = new Date().toISOString();
  const updated = await theThanhVienRepo.update(card.maThe, payload);
  return updated || card;
}

async function getCardSummary(makhachhang) {
  const bundle = await getActiveCardWithTier(makhachhang);
  if (!bundle) return null;
  const { card } = bundle;
  const json = card.toJSON();
  
  // Database V2: chỉ trả về thông tin điểm, không có tier
  return {
    ...json,
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

  await queuePendingPoints(order, amount, card || bundle?.card || null);

  return loyaltyRecord;
}

/**
 * Tạo giao dịch điểm pending khi đơn hàng "Đã giao"
 * Điểm sẽ chờ 7 ngày để được duyệt
 */
async function queuePendingPoints(order, amount, cachedCard = null) {
  const points = calculatePointsFromAmount(amount);
  if (!points) return null;
  
  const bundle = cachedCard ? { card: cachedCard } : await getActiveCardWithTier(order.makhachhang);
  if (!bundle || !bundle.card) return null;
  const card = bundle.card;
  
  // Tính ngày có thể sử dụng điểm (7 ngày sau ngày giao)
  const deliveryDate = order.ngaygiaohang || new Date();
  const availableAt = new Date(deliveryDate);
  availableAt.setDate(availableAt.getDate() + PENDING_DAYS);

  // Cập nhật diem_pending trên thẻ
  await applyPointDelta(card, { deltaPending: points });
  
  // Tạo giao dịch PENDING
  return pointTxRepo.create({
    mathe: card.maThe,
    makhachhang: order.makhachhang,
    madonhang: order.madonhang,
    type: 'EARN',
    diem: points,
    status: 'PENDING',
    available_at: availableAt.toISOString(),
    note: `Tích điểm đơn #${order.madonhang}`,
    metadata: {
      order_amount: amount,
      delivery_date: deliveryDate
    }
  });
}

/**
 * Duyệt điểm pending sau 7 ngày (chạy bởi scheduled job)
 * - Kiểm tra đơn hàng vẫn ở trạng thái "Đã giao / Hoàn thành"
 * - Nếu có trả/đổi/hủy -> CANCEL
 * - Nếu OK -> chuyển sang APPROVED và cộng vào diem_hien_tai
 */
async function releasePendingPoints(referenceDate = new Date()) {
  const dueEntries = await pointTxRepo.findPendingDue(referenceDate.toISOString());
  if (!dueEntries.length) return { released: 0, cancelled: 0 };

  let released = 0;
  let cancelled = 0;

  for (const entry of dueEntries) {
    try {
      // Kiểm tra trạng thái đơn hàng
      const { data: orderRow } = await supabase
        .from('donhang')
        .select('madonhang, trangthaidonhang')
        .eq('madonhang', entry.madonhang)
        .maybeSingle();
      
      const status = (orderRow?.trangthaidonhang || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'D')
        .toUpperCase();
      
      const delivered = status.includes('DA GIAO') || status.includes('HOAN THANH');
      const returned = status.includes('TRA') || status.includes('HUY');

      const bundle = await getActiveCardWithTier(entry.makhachhang);
      if (!bundle || !bundle.card) {
        console.warn(`[releasePendingPoints] Không tìm thấy thẻ cho KH ${entry.makhachhang}`);
        continue;
      }
      let card = bundle.card;

      // Nếu đơn bị hủy/trả -> CANCEL
      if (!delivered || returned) {
        await applyPointDelta(card, { deltaPending: -entry.diem });
        await pointTxRepo.update(entry.id, { 
          status: 'CANCELLED',
          note: `${entry.note || ''} - Đơn hàng không hợp lệ`
        });
        cancelled += 1;
        continue;
      }

      // Đơn hàng OK -> APPROVE điểm
      card = await ensurePointsYear(card);
      await applyPointDelta(card, { 
        deltaPending: -entry.diem, 
        deltaActive: entry.diem, 
        deltaYear: entry.diem 
      });
      
      await pointTxRepo.update(entry.id, {
        status: 'APPROVED',
        approved_at: new Date().toISOString()
      });
      
      released += 1;
    } catch (err) {
      console.error(`[releasePendingPoints] Error processing entry ${entry.id}:`, err);
    }
  }

  return { released, cancelled };
}

async function ensurePointBalance(makhachhang, requestedPoints) {
  if (!requestedPoints) return null;
  const bundle = await getActiveCardWithTier(makhachhang);
  if (!bundle || !bundle.card) {
    const e = new Error('Khong tim thay the thanh vien de su dung diem');
    e.status = 400;
    throw e;
  }
  if (Number(bundle.card.diemHienTai || 0) < requestedPoints) {
    const e = new Error('Diem hien tai khong du de su dung');
    e.status = 400;
    throw e;
  }
  return bundle.card;
}

async function spendPoints(makhachhang, points, madonhang = null) {
  if (!points) return null;
  const card = await ensurePointBalance(makhachhang, points);
  await applyPointDelta(card, { deltaActive: -points });
  return pointTxRepo.create({
    mathe: card.maThe,
    makhachhang,
    madonhang,
    type: 'SPEND',
    diem: -Math.abs(points),
    status: 'APPROVED',
    available_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    note: madonhang ? `Sử dụng điểm cho đơn #${madonhang}` : 'Sử dụng điểm'
  });
}

/**
 * Điều chỉnh điểm pending khi có trả/đổi hàng
 * - Trả toàn bộ: hủy tất cả pending
 * - Trả một phần: giảm pending theo tỷ lệ
 * - Đổi ngang giá: giữ nguyên
 * - Đổi chênh lệch: tăng/giảm pending
 */
async function adjustPendingPointsForReturn(madonhang, adjustmentAmount, reason = 'Trả/đổi hàng') {
  // Lấy tất cả pending transactions của đơn hàng
  const pendingTxs = await pointTxRepo.findByOrder(madonhang);
  const pendingEarn = pendingTxs.filter(tx => tx.status === 'PENDING' && tx.type === 'EARN');
  
  if (!pendingEarn.length) {
    return { adjusted: 0, message: 'Không có điểm pending cần điều chỉnh' };
  }

  const firstTx = pendingEarn[0];
  const originalAmount = firstTx.metadata?.order_amount || 0;
  const originalPoints = firstTx.diem;
  
  // Tính điểm mới dựa trên giá trị còn lại
  const newAmount = Math.max(0, originalAmount + adjustmentAmount);
  const newPoints = calculatePointsFromAmount(newAmount);
  const pointsDelta = newPoints - originalPoints;

  if (newPoints <= 0) {
    // Trả toàn bộ -> hủy tất cả pending
    await pointTxRepo.cancelOrderPoints(madonhang);
    
    // Cập nhật diem_pending trên thẻ
    const bundle = await getActiveCardWithTier(firstTx.makhachhang);
    if (bundle?.card) {
      await applyPointDelta(bundle.card, { deltaPending: -originalPoints });
    }
    
    return { 
      adjusted: -originalPoints, 
      message: 'Đã hủy toàn bộ điểm pending do trả hàng' 
    };
  }

  // Điều chỉnh điểm pending
  const bundle = await getActiveCardWithTier(firstTx.makhachhang);
  if (!bundle?.card) {
    throw new Error('Không tìm thấy thẻ thành viên');
  }

  // Cập nhật transaction
  await pointTxRepo.update(firstTx.id, {
    diem: newPoints,
    note: `${firstTx.note || ''} - Điều chỉnh: ${reason}`,
    metadata: {
      ...firstTx.metadata,
      original_points: originalPoints,
      adjusted_amount: adjustmentAmount,
      new_amount: newAmount,
      adjustment_reason: reason
    }
  });

  // Cập nhật diem_pending trên thẻ
  await applyPointDelta(bundle.card, { deltaPending: pointsDelta });

  return {
    adjusted: pointsDelta,
    message: `Điều chỉnh ${pointsDelta > 0 ? '+' : ''}${pointsDelta} điểm pending`
  };
}

/**
 * Lấy thông tin điểm của khách hàng (cho mobile/web)
 */
async function getPointsSummary(makhachhang) {
  const bundle = await getActiveCardWithTier(makhachhang);
  if (!bundle || !bundle.card) {
    return {
      diem_hien_tai: 0,
      diem_pending: 0,
      diem_nam_hien_tai: 0,
      pending_transactions: []
    };
  }

  const card = bundle.card;
  
  // Lấy danh sách pending transactions với ngày duyệt
  const pendingTxs = await pointTxRepo.findByCustomer(makhachhang, {
    status: 'PENDING',
    type: 'EARN',
    limit: 20
  });

  const pendingDetails = pendingTxs.map(tx => ({
    diem: tx.diem,
    madonhang: tx.madonhang,
    available_at: tx.available_at,
    note: tx.note
  }));

  return {
    diem_hien_tai: Number(card.diemHienTai || 0),
    diem_pending: Number(card.diemPending || 0),
    diem_nam_hien_tai: Number(card.diemNamHienTai || 0),
    nam_diem: card.namDiem,
    last_reset_at: card.lastResetAt,
    pending_transactions: pendingDetails
  };
}

/**
 * Lấy lịch sử giao dịch điểm
 */
async function getPointHistory(makhachhang, options = {}) {
  return pointTxRepo.getPointHistory(makhachhang, options);
}

module.exports = {
  ensureDefaultCard,
  getCardSummary,
  getLoyaltySummary,
  recordOrderSpending,
  queuePendingPoints,
  releasePendingPoints,
  ensurePointBalance,
  spendPoints,
  adjustPendingPointsForReturn,
  getPointsSummary,
  getPointHistory,
};
