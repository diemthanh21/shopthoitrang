﻿const repo = require('../repositories/donhang.repository');
const chitietdonhangService = require('./chitietdonhang.service');
const membershipService = require('./membership.service');
const magiamgiaService = require('./magiamgia.service');
const lichSuService = require('./lichsudonhang.service');
const supabase = require('../../config/db');
const khuyenmaiRepo = require('../repositories/khuyenmai.repository');
const shippingService = require('./phivanchuyen.service');

const normalizeStatus = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase();

const STATUS_CHO_XAC_NHAN = 'Chờ xác nhận';
const STATUS_CHO_LAY_HANG = 'Chờ lấy hàng';

const mapPreferredStatus = status => {
  if (!status) return '';
  const normalized = normalizeStatus(status);
  if (!normalized) return '';
  if (normalized === 'CHO XAC NHAN') return STATUS_CHO_XAC_NHAN;
  if (normalized === 'CHO LAY HANG') return STATUS_CHO_LAY_HANG;
  return status;
};

const isBankTransferMethod = method => {
  if (!method) return false;
  const normalized = normalizeStatus(method).replace(/\s+/g, '');
  return normalized.includes('BANK') || normalized.includes('CHUYENKHOAN');
};

const isPaidStatus = status => {
  if (!status) return false;
  return normalizeStatus(status).includes('DA THANH TOAN');
};

const shouldAutoMoveToPickup = (method, paymentStatus) =>
  isBankTransferMethod(method) && isPaidStatus(paymentStatus);

const deriveInitialStatus = (method, paymentStatus, providedStatus) => {
  const normalizedProvided = normalizeStatus(providedStatus);
  if (normalizedProvided && normalizedProvided !== 'CHO XAC NHAN') {
    return mapPreferredStatus(providedStatus);
  }
  if (shouldAutoMoveToPickup(method, paymentStatus)) {
    return STATUS_CHO_LAY_HANG;
  }
  return STATUS_CHO_XAC_NHAN;
};

const isPendingConfirmationStatus = status => {
  const normalized = normalizeStatus(status);
  return !normalized || normalized === 'CHO XAC NHAN';
};

/**
 * =======================
 * NEW: helper map body update từ FE (camelCase) -> đúng cột DB (snake_case)
 * Giữ nguyên field cũ nếu FE gửi sẵn snake_case.
 * =======================
 */
const mapUpdateBodyToPayload = (body = {}, existing = null) => {
  const b = body || {};
  const payload = { ...b }; // giữ nguyên các field sẵn có

  // Loại bỏ các field không thuộc bảng donhang
  delete payload.diachi;
  delete payload.diaChi;
  delete payload.shippingAddress;
  delete payload.items;

  // map trạng thái đơn
  const st =
    b.trangthaidonhang ??
    b.trangThaiDonHang ??
    b.trangthai ??
    b.trangThai ??
    null;
  if (st != null) payload.trangthaidonhang = st;

  // map trạng thái thanh toán
  const paySt =
    b.trangthaithanhtoan ??
    b.trangThaiThanhToan ??
    null;
  if (paySt != null) payload.trangthaithanhtoan = paySt;

  // map phương thức thanh toán
  const method =
    b.phuongthucthanhtoan ??
    b.phuongThucThanhToan ??
    null;
  if (method != null) payload.phuongthucthanhtoan = method;

  // map lý do hủy
  const reason =
    b.lydohuy ??
    b.lyDoHuy ??
    b.reasonCancel ??
    null;
  if (reason != null) payload.lydohuy = reason;

  /**
   * NEW: map nhân viên duyệt
   * FE có thể gửi manhanvien hoặc maNhanVien…
   */
  const approverRaw =
    b.manhanvien ??
    b.maNhanVien ??
    b.approverId ??
    b.employeeId ??
    null;

  const approverId =
    approverRaw != null && approverRaw !== ''
      ? Number(approverRaw)
      : null;

  // Set manhanvien khi:
  // 1. FE gửi lên giá trị hợp lệ
  // 2. Hoặc đang duyệt đơn sang "Chờ lấy hàng"
  const prevStNorm = normalizeStatus(existing?.trangthaidonhang || '');
  const nextStNorm = normalizeStatus(
    payload.trangthaidonhang || existing?.trangthaidonhang || ''
  );

  const isApproving =
    nextStNorm === normalizeStatus(STATUS_CHO_LAY_HANG) &&
    prevStNorm !== normalizeStatus(STATUS_CHO_LAY_HANG);

  // Luôn set manhanvien nếu FE gửi lên giá trị hợp lệ
  if (approverId) {
    payload.manhanvien = approverId;
  } else if (isApproving) {
    // Nếu đang approve mà không có ID từ FE, giữ nguyên giá trị cũ (nếu có)
    // Không xóa manhanvien cũ
  } else {
    // Không xóa manhanvien nếu FE không gửi
    delete payload.manhanvien;
  }

  return payload;
};

class DonHangService {
  async list() {
    return repo.getAll();
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy đơn hàng');
      e.status = 404;
      throw e;
    }
    
    // Get order items (chi tiết đơn hàng) - đơn giản, không join để tránh lỗi FK
    const { data: orderItems, error } = await supabase
      .from('chitietdonhang')
      .select('*')
      .eq('madonhang', id);
    
    // Base JSON
    const orderJson = item.toJSON();
    
    // Get voucher info from magiamgia_sudung table (voucher IDs used in this order)
    try {
      const { data: usageRecords, error: usageErr } = await supabase
        .from('magiamgia_sudung')
        .select('mavoucher')
        .eq('madonhang', id);
        
      if (!usageErr && usageRecords && usageRecords.length > 0) {
        const voucherIds = usageRecords.map(r => r.mavoucher);
        console.log(`[DonHangService.get] Order ${id} has ${voucherIds.length} vouchers:`, voucherIds);
        
        // Get voucher details from magiamgia table (primary key is mavoucher, not id)
        const { data: vouchers, error: voucherErr } = await supabase
          .from('magiamgia')
          .select('*')
          .in('mavoucher', voucherIds);
          
        if (!voucherErr && vouchers && vouchers.length > 0) {
          console.log(`[DonHangService.get] Found ${vouchers.length} vouchers:`, vouchers.map(v => v.macode));
          
          // Get order items to calculate subtotal
          const { data: orderItems } = await supabase
            .from('chitietdonhang')
            .select('soluong, dongia')
            .eq('madonhang', id);
            
          const subtotal = orderItems?.reduce((sum, item) => sum + (item.soluong * item.dongia), 0) || 0;
          
          // Separate discount and freeship vouchers
          const discountVouchers = [];
          const freeshipVouchers = [];
          
          for (const v of vouchers) {
            let actualDiscountAmount = 0;
            
            // Calculate actual discount amount based on voucher type
            if (v.hinhthuc_giam === 'FREESHIP') {
              // Freeship: discount = min(shipping fee, max discount cap)
              const maxDiscount = v.giam_toi_da || orderJson.phivanchuyen || 0;
              actualDiscountAmount = Math.min(orderJson.phivanchuyen || 0, maxDiscount);
            } else if (v.hinhthuc_giam === 'PERCENT') {
              // Percent: discount = subtotal * percent, capped at max
              const calculatedDiscount = Math.round(subtotal * (v.phantram_giam / 100));
              const maxDiscount = v.giam_toi_da || calculatedDiscount;
              actualDiscountAmount = Math.min(calculatedDiscount, maxDiscount);
            } else if (v.hinhthuc_giam === 'AMOUNT') {
              // Fixed amount: just use the fixed amount
              actualDiscountAmount = v.sotien_giam || 0;
            }
            
            // Map database structure to frontend structure
            const voucherInfo = {
              magiamgia: v.macode, // mã code như "Sale1", "FS1"
              mota: v.mota || v.tenmagiamgia, // fallback to tenmagiamgia
              phantramgiam: v.phantram_giam, // % giảm (nếu là PERCENT)
              sotiengiam: actualDiscountAmount, // số tiền giảm THỰC TẾ đã tính
              giatritoithieu: v.dieukien_don_toi_thieu, // điều kiện đơn tối thiểu
              giamtoida: v.giam_toi_da, // giảm tối đa
              loaigiamgia: v.hinhthuc_giam, // AMOUNT, PERCENT, FREESHIP
            };
            
            if (v.hinhthuc_giam === 'FREESHIP') {
              freeshipVouchers.push(voucherInfo);
            } else {
              discountVouchers.push(voucherInfo);
            }
          }
          
          // Add to orderJson
          if (discountVouchers.length === 1) {
            orderJson.maGiamGiaInfo = discountVouchers[0];
          } else if (discountVouchers.length > 1) {
            orderJson.maGiamGiaInfoList = discountVouchers;
          }
          
          if (freeshipVouchers.length === 1) {
            orderJson.freeshipInfo = freeshipVouchers[0];
          } else if (freeshipVouchers.length > 1) {
            orderJson.freeshipInfoList = freeshipVouchers;
          }
          
          console.log(`[DonHangService.get] Order ${id} vouchers:`, {
            discount: discountVouchers.length,
            freeship: freeshipVouchers.length
          });
        }
      }
    } catch (voucherErr) {
      console.error('[DonHangService.get] Error loading voucher info:', voucherErr);
    }
    
    // Fallback: Get discount code(s) info if magiamgia exists (support multiple separated by comma or pipe)
    if (orderJson.magiamgia) {
      const rawCodes = String(orderJson.magiamgia)
        .split(/[|,]/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
      if (rawCodes.length === 1) {
        try {
          const { data: discountData } = await supabase
            .from('magiamgia')
            .select('*')
            .eq('magiamgia', rawCodes[0])
            .maybeSingle();
          if (discountData) {
            orderJson.maGiamGiaInfo = {
              magiamgia: discountData.magiamgia,
              mota: discountData.mota,
              phantramgiam: discountData.phantramgiam,
              sotiengiam: discountData.sotiengiam,
              giatritoithieu: discountData.giatritoithieu,
            };
          }
        } catch (discErr) {
          console.error('[DonHangService.get] Error loading discount:', discErr);
        }
      } else if (rawCodes.length > 1) {
        try {
          const { data: codesList, error: codesErr } = await supabase
            .from('magiamgia')
            .select('*')
            .in('magiamgia', rawCodes);
          if (!codesErr && Array.isArray(codesList)) {
            orderJson.maGiamGiaInfoList = codesList.map(d => ({
              magiamgia: d.magiamgia,
              mota: d.mota,
              phantramgiam: d.phantramgiam,
              sotiengiam: d.sotiengiam,
              giatritoithieu: d.giatritoithieu,
            }));
          }
        } catch (discListErr) {
          console.error('[DonHangService.get] Error loading discount list:', discListErr);
        }
      }
    }
    
    // Get shipping fee if exists
    if (orderJson.madiachi) {
      try {
        const { data: shippingData } = await supabase
          .from('phivanchuyen')
          .select('*')
          .eq('madiachi', orderJson.madiachi)
          .maybeSingle();
        if (shippingData) {
          orderJson.phiVanChuyen = shippingData.phivanchuyen || 0;
        }
      } catch (shipErr) {
        console.error('[DonHangService.get] Error loading shipping:', shipErr);
      }
    }

    if (!error && orderItems) {
      // Basic items with chitietsize_id
      const itemsFormatted = orderItems.map(it => ({
        machitietdonhang: it.machitietdonhang,
        madonhang: it.madonhang,
        machitietsanpham: it.machitietsanpham,
        chitietsize_id: it.chitietsize_id, // ID from chitietsanpham_kichthuoc
        soluong: it.soluong,
        dongia: it.dongia,
      }));

      // Enrich items: variant -> product + image + size + promotion
      try {
        const variantIds = [...new Set(itemsFormatted.map(x => x.machitietsanpham).filter(Boolean))];
        const sizeIds = [...new Set(itemsFormatted.map(x => x.chitietsize_id).filter(Boolean))];
        
        if (variantIds.length > 0) {
          const { data: variants, error: vErr } = await supabase
            .from('chitietsanpham')
            .select('*')
            .in('machitietsanpham', variantIds);
          if (!vErr && variants) {
            const productIds = [...new Set(variants.map(v => v.masanpham).filter(Boolean))];

            const [prodRes, imgRes, sizeRes, allSizesRes, promoRes, giftProductsRes] = await Promise.all([
              productIds.length
                ? supabase.from('sanpham').select('*').in('masanpham', productIds)
                : Promise.resolve({ data: [], error: null }),
              supabase.from('hinhanhsanpham').select('*').in('machitietsanpham', variantIds),
              sizeIds.length
                ? supabase.from('chitietsanpham_kichthuoc').select('id, machitietsanpham, makichthuoc, so_luong, kichthuocs(makichthuoc, ten_kichthuoc)').in('id', sizeIds)
                : Promise.resolve({ data: [], error: null }),
              // Get all sizes for these variants to match by machitietsanpham + kichthuoc
              supabase.from('chitietsanpham_kichthuoc').select('id, machitietsanpham, makichthuoc, so_luong, kichthuocs(makichthuoc, ten_kichthuoc)').in('machitietsanpham', variantIds),
              // (OLD REMOVED) direct khuyenmai by machitietsanpham was incorrect – use repository to load active promos
              Promise.resolve({ data: [], error: null }),
              // Get gift products info (will be enriched after mapping promos)
              supabase.from('sanpham').select('masanpham, tensanpham')
            ]);

            const variantMap = new Map();
            for (const v of variants) variantMap.set(v.machitietsanpham, v);

            const productMap = new Map();
            if (!prodRes.error && prodRes.data) for (const p of prodRes.data) productMap.set(p.masanpham, p);

            const imagesByVariant = new Map();
            if (!imgRes.error && imgRes.data) {
              for (const img of imgRes.data) {
                if (!imagesByVariant.has(img.machitietsanpham)) imagesByVariant.set(img.machitietsanpham, []);
                imagesByVariant.get(img.machitietsanpham).push(img);
              }
            }
            
            // Build size map by id (chitietsize_id)
            const sizeMap = new Map();
            if (!sizeRes.error && sizeRes.data) {
              for (const sz of sizeRes.data) {
                // Extract size name from nested kichthuocs object
                const sizeName = sz.kichthuocs?.ten_kichthuoc || null;
                sizeMap.set(sz.id, { ...sz, sizeName });
              }
            }
            
            // Build size map by variant + size name for fallback
            const sizesByVariant = new Map();
            if (!allSizesRes.error && allSizesRes.data) {
              for (const sz of allSizesRes.data) {
                const key = `${sz.machitietsanpham}`;
                if (!sizesByVariant.has(key)) sizesByVariant.set(key, []);
                const sizeName = sz.kichthuocs?.ten_kichthuoc || null;
                sizesByVariant.get(key).push({ ...sz, sizeName });
              }
            }
            
            // Build gift product map
            const giftProductMap = new Map();
            if (!giftProductsRes.error && giftProductsRes.data) {
              for (const gp of giftProductsRes.data) {
                giftProductMap.set(gp.masanpham, gp.tensanpham);
              }
            }
            
            // Simplified promotion logic (corrected, with gift quantity)
            const promoByVariant = new Map();
            const orderQtyByVariant = new Map();
            itemsFormatted.forEach(it => {
              if (it.machitietsanpham) orderQtyByVariant.set(it.machitietsanpham, Number(it.soluong) || 0);
            });
            try {
              const { data: rawPromos, error: rawErr } = await supabase
                .from('khuyenmai')
                .select('makhuyenmai, tenchuongtrinh, loaikhuyenmai, masanpham, tylegiam, masanphamtang, sanpham_apdung_ids, sanpham_tang_ids, sanpham_tang_variants');
              if (rawErr) {
                console.error('[Promotion Debug] Promo fetch error:', rawErr);
              } else if (Array.isArray(rawPromos)) {
                console.log(`[Promotion Debug] Loaded ${rawPromos.length} promos (raw)`);
                // Collect all potential gift product IDs across promos
                const giftProductIdSet = new Set();
                for (const pr of rawPromos) {
                  const addId = id => { if (Number(id)) giftProductIdSet.add(Number(id)); };
                  addId(pr.masanphamtang);
                  // Parse lists quickly (JSON or comma separated)
                  const rawGiftList = pr.sanpham_tang_ids;
                  if (rawGiftList) {
                    let arr = [];
                    if (Array.isArray(rawGiftList)) arr = rawGiftList; else {
                      try { const parsed = JSON.parse(rawGiftList); if (Array.isArray(parsed)) arr = parsed; else arr = String(rawGiftList).split(','); }
                      catch { arr = String(rawGiftList).split(','); }
                    }
                    arr.forEach(addId);
                  }
                  // Variant gifts JSON
                  if (pr.sanpham_tang_variants) {
                    let vgArr = [];
                    try { const parsed = JSON.parse(pr.sanpham_tang_variants); if (Array.isArray(parsed)) vgArr = parsed; } catch {}
                    vgArr.forEach(vg => addId(vg.productId || vg.masanpham || vg.product_id));
                  }
                }
                // Fetch representative gift variants + images
                let giftVariants = [];
                let giftImages = [];
                let giftSizes = [];
                if (giftProductIdSet.size) {
                  try {
                    const { data: gvData, error: gvErr } = await supabase
                      .from('chitietsanpham')
                      .select('*')
                      .in('masanpham', [...giftProductIdSet]);
                    if (!gvErr && Array.isArray(gvData)) giftVariants = gvData;
                    const giftVariantIds = [...new Set(giftVariants.map(g => g.machitietsanpham).filter(Boolean))];
                    if (giftVariantIds.length) {
                      const { data: giData, error: giErr } = await supabase
                        .from('hinhanhsanpham')
                        .select('*')
                        .in('machitietsanpham', giftVariantIds);
                      if (!giErr && Array.isArray(giData)) giftImages = giData;
                      // Fetch size bridge rows for gift variants (first size used as representative)
                      const { data: gsData, error: gsErr } = await supabase
                        .from('chitietsanpham_kichthuoc')
                        .select('id, machitietsanpham, makichthuoc, kichthuocs(ten_kichthuoc)')
                        .in('machitietsanpham', giftVariantIds);
                      if (!gsErr && Array.isArray(gsData)) giftSizes = gsData;
                    }
                  } catch (giftFetchErr) {
                    console.error('[Promotion Debug] Gift variant/image fetch error:', giftFetchErr);
                  }
                }
                const repGiftVariantByProduct = new Map();
                for (const gv of giftVariants) {
                  if (!repGiftVariantByProduct.has(gv.masanpham)) repGiftVariantByProduct.set(gv.masanpham, gv);
                }
                const giftImageByVariant = new Map();
                for (const img of giftImages) {
                  if (!giftImageByVariant.has(img.machitietsanpham)) giftImageByVariant.set(img.machitietsanpham, img);
                }
                const giftSizeByVariant = new Map();
                for (const sz of giftSizes) {
                  const sizeName = sz.kichthuocs?.ten_kichthuoc || null;
                  if (sizeName && !giftSizeByVariant.has(sz.machitietsanpham)) {
                    giftSizeByVariant.set(sz.machitietsanpham, sizeName);
                  }
                }
                const parseJsonArray = (val) => {
                  if (!val) return [];
                  if (Array.isArray(val)) return val.map(Number).filter(n => Number.isFinite(n));
                  if (typeof val === 'string') {
                    try {
                      const parsed = JSON.parse(val);
                      if (Array.isArray(parsed)) return parsed.map(Number).filter(n => Number.isFinite(n));
                    } catch {
                      return val.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));
                    }
                  }
                  return [];
                };
                const parseVariantArr = (val) => {
                  if (!val) return [];
                  let source = val;
                  if (typeof val === 'string') {
                    try { source = JSON.parse(val); } catch { return []; }
                  }
                  if (!Array.isArray(source)) return [];
                  return source.map(v => ({
                    productId: Number(v.productId ?? v.masanpham ?? v.product_id) || null,
                    variantId: Number(v.variantId ?? v.maChiTietSanPham ?? v.variant_id) || null,
                    sizeId: Number(v.sizeId ?? v.kichThuocId ?? v.size_id) || null,
                    quantity: Number(v.quantity ?? v.soLuong ?? v.qty ?? 1) || 1,
                    giftQty: Number(v.giftQty ?? v.soLuongTang ?? v.gift_qty ?? 1) || 1,
                  })).filter(x => x.productId);
                };
                const promosByProduct = new Map();
                for (const pr of rawPromos) {
                  const basePid = Number(pr.masanpham) || null;
                  const applyIds = parseJsonArray(pr.sanpham_apdung_ids);
                  const allApply = new Set(applyIds);
                  if (basePid) allApply.add(basePid);
                  const giftIds = parseJsonArray(pr.sanpham_tang_ids);
                  const variantGiftEntries = parseVariantArr(pr.sanpham_tang_variants);
                  for (const pid of allApply) {
                    if (!promosByProduct.has(pid)) promosByProduct.set(pid, []);
                    promosByProduct.get(pid).push({ ...pr, _giftProductIds: giftIds, _variantGifts: variantGiftEntries });
                  }
                }
                for (const variant of variants) {
                  const vId = variant.machitietsanpham;
                  const pId = variant.masanpham;
                  const relatedPromos = promosByProduct.get(pId) || [];
                  if (!relatedPromos.length) continue;
                  const discountPromo = relatedPromos.find(p => String(p.loaikhuyenmai || '').toLowerCase().includes('giam'));
                  const giftPromo = relatedPromos.find(p => String(p.loaikhuyenmai || '').toLowerCase().includes('tang'));
                  const payload = {};
                  if (discountPromo) {
                    payload.discount = {
                      makhuyenmai: discountPromo.makhuyenmai,
                      tenkhuyenmai: discountPromo.tenchuongtrinh,
                      phantramgiam: Number(discountPromo.tylegiam) || null,
                    };
                  }
                  if (giftPromo) {
                    let giftProdId = Number(giftPromo.masanphamtang) || giftPromo._giftProductIds[0] || (giftPromo._variantGifts[0]?.productId) || null;
                    const giftName = giftProdId ? giftProductMap.get(giftProdId) || null : null;
                    let giftQty = 1;
                    if (Array.isArray(giftPromo._variantGifts) && giftPromo._variantGifts.length) {
                      const match = giftPromo._variantGifts.find(e => e.productId === giftProdId) || giftPromo._variantGifts.find(e => e.productId === pId);
                      if (match) {
                        if (Number(match.giftQty) > 0) giftQty = Number(match.giftQty);
                        else if (Number(match.quantity) > 0) giftQty = Number(match.quantity);
                      }
                    }
                    if (giftQty === 1) {
                      const orderedQty = orderQtyByVariant.get(vId);
                      if (Number(orderedQty) > 1) giftQty = Number(orderedQty);
                    }
                    // Enrich gift variant details (color, size, image)
                    let gColor = null, gSize = null, gImage = null;
                    if (giftProdId && repGiftVariantByProduct.has(giftProdId)) {
                      const gVar = repGiftVariantByProduct.get(giftProdId);
                      gColor = gVar.mausac || null;
                      gSize = gVar.kichthuoc || giftSizeByVariant.get(gVar.machitietsanpham) || null;
                      const gImgObj = giftImageByVariant.get(gVar.machitietsanpham);
                      gImage = gImgObj?.duongdanhinhanh || null;
                    }
                    payload.gift = {
                      makhuyenmai: giftPromo.makhuyenmai,
                      tenkhuyenmai: giftPromo.tenchuongtrinh,
                      masanphamtang: giftProdId,
                      tensanphamtang: giftName,
                      mausac: gColor,
                      kichthuoc: gSize,
                      imageUrl: gImage,
                      soluongtang: giftQty,
                    };
                  }
                  if (payload.discount || payload.gift) {
                    promoByVariant.set(vId, payload);
                  }
                }
              }
            } catch (promoErr) {
              console.error('[Promotion Debug] Promo mapping failed:', promoErr);
            }

            orderJson.items = itemsFormatted.map(it => {
              const v = variantMap.get(it.machitietsanpham);
              const p = v ? productMap.get(v.masanpham) : null;
              const imgs = imagesByVariant.get(it.machitietsanpham) || [];
              const imageUrl = imgs[0]?.duongdanhinhanh || null;
              const promo = promoByVariant.get(it.machitietsanpham);
              
              // Try to get size: 1) by chitietsize_id, 2) match variant's kichthuoc in bridge table, 3) fallback to variant.kichthuoc
              let actualSize = null;
              const sizeInfo = sizeMap.get(it.chitietsize_id);
              
              console.log(`[Size Debug] Item ${it.machitietdonhang}: chitietsize_id=${it.chitietsize_id}, variant.kichthuoc=${v?.kichthuoc}`);
              
              if (sizeInfo?.sizeName) {
                actualSize = sizeInfo.sizeName;
                console.log(`[Size Debug] Found size from chitietsize_id: ${actualSize}`);
              } else if (v?.kichthuoc) {
                // Fallback: find size in bridge table matching this variant and size name
                const availableSizes = sizesByVariant.get(`${it.machitietsanpham}`) || [];
                console.log(`[Size Debug] Available sizes for variant ${it.machitietsanpham}:`, availableSizes.map(s => s.sizeName));
                const matchingSize = availableSizes.find(s => s.sizeName === v.kichthuoc);
                actualSize = matchingSize?.sizeName || v.kichthuoc;
                console.log(`[Size Debug] Using fallback size: ${actualSize}`);
              } else {
                console.log(`[Size Debug] No size found for item ${it.machitietdonhang}`);
              }
              
              return {
                ...it,
                masanpham: v?.masanpham || null,
                productName: p?.tensanpham || null,
                variant: {
                  color: v?.mausac || null,
                  size: actualSize || null,
                  price: v?.giaban || null,
                },
                imageUrl,
                thanhTien: (it.soluong || 0) * (it.dongia || v?.giaban || 0),
                // Promotion info if exists
                // Unified promotion payload: { discount?, gift? }
                promotion: promo ? {
                  discount: promo.discount || null,
                  gift: promo.gift || null,
                } : null,
              };
            });
            // Compute subtotal for FE usage (before shipping & discounts)
            orderJson.subtotal = orderJson.items.reduce((s, it) => s + (Number(it.thanhTien) || 0), 0);
          } else {
            orderJson.items = itemsFormatted;
          }
        } else {
          orderJson.items = itemsFormatted;
        }
      } catch (enrichErr) {
        console.error('[DonHangService.get] Enrich items error:', enrichErr);
        orderJson.items = itemsFormatted;
      }
    }

    // Try to attach per-order shipping address snapshot
    try {
      const { data: orderAddr, error: addrErr } = await supabase
        .from('diachigiaohang')
        .select('*')
        .eq('madonhang', id)
        .maybeSingle();
      if (!addrErr && orderAddr) {
        orderJson.diaChi = {
          madiachi: orderAddr.madiachi,
          ten: orderAddr.ten,
          sodienthoai: orderAddr.sodienthoai,
          tinh: orderAddr.tinh,
          phuong: orderAddr.phuong,
          diachicuthe: orderAddr.diachicuthe,
          diachi: orderAddr.diachi,
          macdinh: false,
        };
      }
    } catch (addrSnapErr) {
      console.warn('[DonHangService.get] diachigiaohang lookup failed (maybe table missing):', addrSnapErr?.message || addrSnapErr);
    }

    // Attach customer and default address for more detailed admin view (fallback)
    try {
      if (orderJson.makhachhang) {
        const [{ data: customer }, { data: addresses }] = await Promise.all([
          supabase.from('taikhoankhachhang').select('*').eq('makhachhang', orderJson.makhachhang).maybeSingle(),
          supabase.from('diachikhachhang').select('*').eq('makhachhang', orderJson.makhachhang)
        ]);

        if (customer) {
          orderJson.khachHang = {
            makhachhang: customer.makhachhang,
            hoten: customer.hoten,
            email: customer.email,
            sodienthoai: customer.sodienthoai,
          };
        }

        // If diachigiaohang not found, but we have madiachi, try to pick that exact address
        if (!orderJson.diaChi && orderJson.madiachi) {
          const { data: addrById } = await supabase
            .from('diachikhachhang')
            .select('*')
            .eq('madiachi', orderJson.madiachi)
            .maybeSingle();
          if (addrById) {
            orderJson.diaChi = {
              madiachi: addrById.madiachi,
              ten: addrById.ten,
              sodienthoai: addrById.sodienthoai,
              tinh: addrById.tinh,
              phuong: addrById.phuong,
              diachicuthe: addrById.diachicuthe,
              macdinh: !!addrById.macdinh,
              diachi: addrById.diachi,
            };
          }
        }

        if (!orderJson.diaChi && Array.isArray(addresses) && addresses.length) {
          const def = addresses.find(a => a.macdinh) || addresses[0];
          // If structured fields missing, try to parse diachi string
          let tinh = def.tinh, phuong = def.phuong, diachicuthe = def.diachicuthe;
          if ((!tinh || !phuong || !diachicuthe) && def.diachi) {
            const parts = String(def.diachi).split('|').map(p => p.trim());
            const location = parts[2] || '';
            const [pTinh, pPhuong] = location.split(',').map(p => p.trim());
            tinh = tinh || pTinh || null;
            phuong = phuong || pPhuong || null;
            diachicuthe = diachicuthe || parts[3] || null;
          }
          orderJson.diaChi = def ? {
            madiachi: def.madiachi,
            ten: def.ten,
            sodienthoai: def.sodienthoai,
            tinh,
            phuong,
            diachicuthe,
            macdinh: !!def.macdinh,
            diachi: def.diachi || `${def.ten || ''} | ${def.sodienthoai || ''} | ${tinh || ''}, ${phuong || ''} | ${diachicuthe || ''}`,
          } : null;
        }
      }
    } catch (custErr) {
      console.error('[DonHangService.get] Enrich customer/address error:', custErr);
    }

    // Calculate total discount for orders without explicit discount code info
    // (Legacy orders that don't have magiamgia field but may have discounts applied)
    if (!orderJson.maGiamGiaInfo && !orderJson.maGiamGiaInfoList && orderJson.subtotal && orderJson.thanhtien) {
      const shipping = orderJson.phivanchuyen || orderJson.phiVanChuyen || 0;
      const calculatedDiscount = orderJson.subtotal + shipping - orderJson.thanhtien;
      if (calculatedDiscount > 0) {
        orderJson.totalDiscount = calculatedDiscount;
        console.log(`[DonHangService] Calculated discount for order ${id}: ${calculatedDiscount} VND (subtotal: ${orderJson.subtotal}, shipping: ${shipping}, total: ${orderJson.thanhtien})`);
      }
    }

    return orderJson;
  }

  async getByCustomer(makhachhang) {
    const orders = await repo.getByCustomer(makhachhang);
    
    // Get all order items for these orders (không join để đảm bảo ổn định)
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.madonhang);
      
      const { data: allOrderItems, error } = await supabase
        .from('chitietdonhang')
        .select('*')
        .in('madonhang', orderIds);
      
      if (!error && allOrderItems) {
        // Group items by order
        const itemsByOrder = {};
        allOrderItems.forEach(item => {
          if (!itemsByOrder[item.madonhang]) {
            itemsByOrder[item.madonhang] = [];
          }
          itemsByOrder[item.madonhang].push({
            machitietdonhang: item.machitietdonhang,
            madonhang: item.madonhang,
            machitietsanpham: item.machitietsanpham,
            soluong: item.soluong,
            dongia: item.dongia,
          });
        });

        // Enrich items with product info (for review feature)
        try {
          const allVariantIds = [...new Set(allOrderItems.map(x => x.machitietsanpham).filter(Boolean))];
          if (allVariantIds.length > 0) {
            const { data: variants, error: vErr } = await supabase
              .from('chitietsanpham')
              .select('*')
              .in('machitietsanpham', allVariantIds);
            
            if (!vErr && variants) {
              const productIds = [...new Set(variants.map(v => v.masanpham).filter(Boolean))];
              
              const [prodRes, imgRes] = await Promise.all([
                productIds.length
                  ? supabase.from('sanpham').select('*').in('masanpham', productIds)
                  : Promise.resolve({ data: [], error: null }),
                supabase.from('hinhanhsanpham').select('*').in('machitietsanpham', allVariantIds)
              ]);

              const variantMap = new Map();
              for (const v of variants) variantMap.set(v.machitietsanpham, v);

              const productMap = new Map();
              if (!prodRes.error && prodRes.data) for (const p of prodRes.data) productMap.set(p.masanpham, p);

              const imagesByVariant = new Map();
              if (!imgRes.error && imgRes.data) {
                for (const img of imgRes.data) {
                  if (!imagesByVariant.has(img.machitietsanpham)) imagesByVariant.set(img.machitietsanpham, []);
                  imagesByVariant.get(img.machitietsanpham).push(img);
                }
              }

              // Enrich all items
              for (const orderId in itemsByOrder) {
                itemsByOrder[orderId] = itemsByOrder[orderId].map(it => {
                  const v = variantMap.get(it.machitietsanpham);
                  const p = v ? productMap.get(v.masanpham) : null;
                  const imgs = imagesByVariant.get(it.machitietsanpham) || [];
                  const imageUrl = imgs[0]?.duongdanhinhanh || null;
                  return {
                    ...it,
                    masanpham: v?.masanpham || null, // Add productId for review feature
                    productName: p?.tensanpham || null,
                    variant: {
                      color: v?.mausac || null,
                      size: v?.kichthuoc || null,
                      price: v?.giaban || null,
                    },
                    imageUrl,
                    thanhTien: (it.soluong || 0) * (it.dongia || v?.giaban || 0),
                  };
                });
              }
            }
          }
        } catch (enrichErr) {
          console.error('[DonHangService.getByCustomer] Enrich items error:', enrichErr);
        }
        
        // Attach items to each order
        return orders.map(order => {
          const orderJson = order.toJSON();
          orderJson.items = itemsByOrder[order.madonhang] || [];
          return orderJson;
        });
      }
    }
    
    return orders;
  }

  async create(body) {
    if (!body.makhachhang || !body.phuongthucthanhtoan) {
      const e = new Error('Thiếu thông tin bắt buộc: makhachhang, phuongthucthanhtoan');
      e.status = 400;
      throw e;
    }

        const pointsToSpend = Math.max(0, Number(body.diem_su_dung ?? body.pointsUsed ?? 0));

    if (pointsToSpend > 0) {

      await membershipService.ensurePointBalance(body.makhachhang, pointsToSpend);

    }



// Create the order first (robust to environments chưa có cột madiachi)
    const paymentStatus = body.trangthaithanhtoan || 'Chưa thanh toán';
    const orderStatus = deriveInitialStatus(
      body.phuongthucthanhtoan,
      paymentStatus,
      body.trangthaidonhang
    );
    // Extract discount codes from body
    const discountCodes = body.magiamgia || body.maGiamGia || body.discountCodes || null;
    const discountCodesStr = discountCodes 
      ? (Array.isArray(discountCodes) ? discountCodes.join(',') : String(discountCodes))
      : null;

    const basePayload = {
      makhachhang: body.makhachhang,
      thanhtien: body.thanhtien || 0,
      phuongthucthanhtoan: body.phuongthucthanhtoan,
      trangthaithanhtoan: paymentStatus,
      trangthaidonhang: orderStatus,
      magiamgia: discountCodesStr,
    };
    const withMadiachi = {
      ...basePayload,
      madiachi: body.madiachi || body.maDiaChi || (body.diachi && body.diachi.madiachi) || null,
    };

    let order;
    try {
      order = await repo.create(withMadiachi);
    } catch (e) {
      const msg = String(e?.message || e).toLowerCase();
      // Nếu DB chưa có cột madiachi thì thử insert lại không có trường này để không chặn luồng đặt hàng
      if (msg.includes('column') && msg.includes('madiachi')) {
        order = await repo.create(basePayload);
      } else {
        throw e;
      }
    }

    let resolvedAddress = null;
    // Persist selected shipping address snapshot into diachigiaohang (if provided)
    try {
      const providedAddress = body.diachi || body.diaChi || null;
      const providedAddressId = body.madiachi || body.maDiaChi || (providedAddress && providedAddress.madiachi);

      if (providedAddress) {
        resolvedAddress = {
          madiachi: providedAddress.madiachi || providedAddress.id || null,
          ten: providedAddress.ten || null,
          sodienthoai: providedAddress.sodienthoai || providedAddress.soDienThoai || null,
          tinh: providedAddress.tinh || null,
          phuong: providedAddress.phuong || null,
          diachicuthe: providedAddress.diachicuthe || providedAddress.diaChiCuThe || null,
          diachi: providedAddress.diachi || null,
        };
      } else if (providedAddressId) {
        const { data: addr } = await supabase
          .from('diachikhachhang')
          .select('*')
          .eq('madiachi', providedAddressId)
          .maybeSingle();
        if (addr) {
          resolvedAddress = {
            madiachi: addr.madiachi,
            ten: addr.ten,
            sodienthoai: addr.sodienthoai,
            tinh: addr.tinh,
            phuong: addr.phuong,
            diachicuthe: addr.diachicuthe,
            diachi: addr.diachi,
          };
        }
      }

      if (resolvedAddress) {
        // Try to insert to diachigiaohang table (if exists)
        const { error: insertAddrErr } = await supabase.from('diachigiaohang').insert([
          {
            madonhang: order.madonhang,
            madiachi: resolvedAddress.madiachi,
            ten: resolvedAddress.ten,
            sodienthoai: resolvedAddress.sodienthoai,
            tinh: resolvedAddress.tinh,
            phuong: resolvedAddress.phuong,
            diachicuthe: resolvedAddress.diachicuthe,
            diachi: resolvedAddress.diachi,
          },
        ]);
        if (insertAddrErr) {
          console.warn('[DonHangService.create] diachigiaohang insert failed (table missing or other):', insertAddrErr.message);
        }

        // Also try to update donhang.madiachi for straightforward joins (nếu cột tồn tại)
        try {
          if (resolvedAddress.madiachi) {
            await repo.update(order.madonhang, { madiachi: resolvedAddress.madiachi });
          }
        } catch (e) {
          const msg = String(e?.message || e).toLowerCase();
          if (msg.includes('column') && msg.includes('madiachi')) {
            // môi trường chưa có cột -> bỏ qua để không làm hỏng luồng
            console.warn('[DonHangService.create] madiachi column missing, skip update');
          } else {
            console.warn('[DonHangService.create] update donhang.madiachi failed:', e?.message || e);
          }
        }
      }
    } catch (addrErr) {
      console.error('[DonHangService.create] Persist shipping address error:', addrErr);
    }

    let shippingProvinceSnapshot =
      (resolvedAddress && resolvedAddress.tinh) ||
      body.tinh_giaohang_snapshot ||
      body.tinhGiaohangSnapshot ||
      null;
    const providedShippingFee =
      body.phivanchuyen ??
      body.phiVanChuyen ??
      body.shippingFee ??
      null;
    let computedShippingFee = 0;

    try {
      computedShippingFee = await shippingService.resolveShippingFee({
        province: shippingProvinceSnapshot,
        fallbackFee: providedShippingFee,
      });
    } catch (shippingErr) {
      console.error('[DonHangService.create] Calculate shipping fee error:', shippingErr);
      if (providedShippingFee !== null && providedShippingFee !== undefined) {
        const parsed = Number(providedShippingFee);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          computedShippingFee = parsed;
        }
      }
    }

    computedShippingFee = Math.max(0, Number(computedShippingFee) || 0);

    try {
      const hasProvinceSnapshot =
        shippingProvinceSnapshot !== null &&
        shippingProvinceSnapshot !== undefined &&
        String(shippingProvinceSnapshot).trim() !== '';
      const shouldUpdateShipping =
        hasProvinceSnapshot ||
        (Number(computedShippingFee) || 0) !== (Number(order.phivanchuyen) || 0);
      if (shouldUpdateShipping) {
        const updatePayload = {
          phivanchuyen: computedShippingFee,
          tinh_giaohang_snapshot: shippingProvinceSnapshot,
        };
        const updatedOrder = await repo.update(order.madonhang, updatePayload);
        if (updatedOrder) {
          order = updatedOrder;
        } else {
          order.phivanchuyen = computedShippingFee;
          order.tinh_giaohang_snapshot = shippingProvinceSnapshot;
        }
      } else {
        order.phivanchuyen = computedShippingFee;
        order.tinh_giaohang_snapshot = shippingProvinceSnapshot;
      }
    } catch (shippingUpdateErr) {
      console.warn('[DonHangService.create] Unable to persist shipping fee info:', shippingUpdateErr);
      order.phivanchuyen = computedShippingFee;
      order.tinh_giaohang_snapshot = shippingProvinceSnapshot;
    }

    const giftConsumptions = [];    // If items are provided, create order items
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      console.log(`[DonHangService.create] Creating ${body.items.length} order items for order ${order.madonhang}`);
      console.log(`[DonHangService.create] Items data:`, JSON.stringify(body.items, null, 2));
      
      for (const item of body.items) {
        try {
          console.log(`[DonHangService.create] Processing item:`, item);
          
          // Map field names: mobile/web sends machitietsanpham/soluong/dongia + optional size bridge
          const variantId = item.machitietsanpham || item.variantId;
          const quantity = item.soluong || item.quantity;
          const price = item.dongia || item.price;
          // Size bridge: id của bảng chitietsanpham_kichthuoc
          let sizeBridgeId =
            item.chitietsizeId ||
            item.chitietsize_id ||
            item.sizeBridgeId ||
            null;
          // Hoặc client chỉ gửi makichthuoc
          const sizeId =
            item.makichthuoc ||
            item.sizeId ||
            item.kichthuocId ||
            null;
          
          console.log(`[DonHangService.create] Mapped values:`, {
            variantId,
            quantity,
            price,
            sizeBridgeId,
            sizeId,
            madonhang: order.madonhang
          });

          // Nếu chưa có bridge id nhưng có makichthuoc => tìm dòng size tương ứng
          if (!sizeBridgeId && variantId && sizeId) {
            try {
              const { data: sizeRow, error: sizeErr } = await supabase
                .from('chitietsanpham_kichthuoc')
                .select('id')
                .eq('machitietsanpham', variantId)
                .eq('makichthuoc', sizeId)
                .maybeSingle();
              if (sizeErr) {
                console.error('[DonHangService.create] Lookup size row failed:', sizeErr);
              } else if (sizeRow?.id) {
                sizeBridgeId = sizeRow.id;
              }
            } catch (lookupErr) {
              console.error('[DonHangService.create] Lookup size row exception:', lookupErr);
            }
          }
          
          // Create order item
          await chitietdonhangService.taoMoi({
            madonhang: order.madonhang,
            machitietsanpham: variantId,
            soluong: quantity,
            dongia: price,
            chitietsize_id: sizeBridgeId || null,
          });
          console.log(`[DonHangService.create] Created order item: variant=${variantId}, qty=${quantity}, price=${price}, chitietsize_id=${sizeBridgeId || 'null'}`);

          // Trừ tồn kho theo đúng dòng size nếu biết
          if (sizeBridgeId && quantity > 0) {
            try {
              const { data: sizeRow, error: sizeFetchErr } = await supabase
                .from('chitietsanpham_kichthuoc')
                .select('so_luong')
                .eq('id', sizeBridgeId)
                .maybeSingle();

              if (sizeFetchErr) {
                console.error('[DonHangService.create] Error fetching size stock for id', sizeBridgeId, sizeFetchErr);
              } else if (sizeRow) {
                const current = Number(sizeRow.so_luong) || 0;
                const newQty = Math.max(0, current - Number(quantity || 0));
                const { error: sizeUpdErr } = await supabase
                  .from('chitietsanpham_kichthuoc')
                  .update({ so_luong: newQty })
                  .eq('id', sizeBridgeId);
                if (sizeUpdErr) {
                  console.error('[DonHangService.create] Error updating size stock for id', sizeBridgeId, sizeUpdErr);
                } else {
                  console.log(`[DonHangService.create] Updated size stock id=${sizeBridgeId}: ${current} -> ${newQty}`);
                }
              }
            } catch (stockErr) {
              console.error('[DonHangService.create] Size stock update exception:', stockErr);
            }
          }
          
          const giftVariantId = item.giftVariantId || item.gift_variant_id || null;        
          const giftSizeBridgeId = item.giftSizeBridgeId || item.gift_size_bridge_id || null;
          const giftQuantity = Number(item.giftQuantity || item.gift_quantity || 0);
          const giftPromotionId = item.giftPromotionId || item.gift_promotion_id || null;
                             if (giftVariantId && giftPromotionId && giftQuantity > 0) {          
                                giftConsumptions.push({           promotionId: Number(giftPromotionId),     
                                          variantId: Number(giftVariantId),
                                            sizeBridgeId: giftSizeBridgeId ? Number(giftSizeBridgeId) : null,    
                                                    quantity: giftQuantity,         });        }      } catch (itemError) {
          console.error(`[DonHangService.create] Error creating order item:`, itemError);
          // Continue creating other items even if one fails
        }
      }
    }

    if (pointsToSpend > 0 && order?.madonhang) {

      await membershipService.spendPoints(order.makhachhang, pointsToSpend, order.madonhang);

      order.pointsRedeemed = pointsToSpend;

    }



    if (giftConsumptions.length) {   await this._consumeGiftPromotions(giftConsumptions);  }
    
    // Save discount code usage history (using voucher_ids from mobile)
      try {
        const voucherIds = body.voucher_ids || body.voucherIds || body.appliedVoucherIds || [];
        
        console.log('[DonHangService.create] Checking voucher IDs:', {
          voucher_ids: body.voucher_ids,
          voucherIds: body.voucherIds,
          appliedVoucherIds: body.appliedVoucherIds,
          final: voucherIds
        });
        
        if (Array.isArray(voucherIds) && voucherIds.length > 0 && order?.madonhang) {
          const validatedVouchers = await magiamgiaService.ensureCustomerVoucherEligibility(
            voucherIds,
            body.makhachhang
          );

          console.log(`[DonHangService.create] Saving ${voucherIds.length} voucher usage records for order ${order.madonhang}`);
          
          const usageRecords = voucherIds.map(voucherId => ({
            mavoucher: Number(voucherId),
            makhachhang: body.makhachhang,
            madonhang: order.madonhang,
            ngay_su_dung: new Date().toISOString(),
          }));
          
          console.log('[DonHangService.create] Usage records to insert:', JSON.stringify(usageRecords, null, 2));
          
          const { data: insertedData, error: usageErr } = await supabase
            .from('magiamgia_sudung')
            .insert(usageRecords)
            .select();
            
          if (usageErr) {
            console.error('[DonHangService.create] ❌ Error saving voucher usage:', {
              code: usageErr.code,
              message: usageErr.message,
              details: usageErr.details,
              hint: usageErr.hint
            });
          } else {
            console.log(`[DonHangService.create] ✅ Saved ${voucherIds.length} voucher usage record(s):`, insertedData);
            await magiamgiaService.incrementUsageCounts(validatedVouchers);
          }
        } else {
          console.log('[DonHangService.create] No voucher IDs provided or invalid format');
        }
      } catch (discountErr) {
        console.error('[DonHangService.create] Voucher usage tracking failed:', discountErr.message || discountErr);
        throw discountErr;
      }
    
    return order;
  }

  async _consumeGiftPromotions(consumptions = []) {
    if (!Array.isArray(consumptions) || consumptions.length === 0) return;

    const grouped = new Map();
    for (const item of consumptions) {
      const promoId = Number(item.promotionId);
      const variantId = Number(item.variantId);
      const qty = Number(item.quantity);
      if (!promoId || !variantId || !(qty > 0)) continue;
      if (!grouped.has(promoId)) grouped.set(promoId, []);
      grouped.get(promoId).push({
        variantId,
        sizeBridgeId: item.sizeBridgeId ? Number(item.sizeBridgeId) : null,
        quantity: qty,
      });
    }

    for (const [promoId, entries] of grouped.entries()) {
      let promo;
      try {
        promo = await khuyenmaiRepo.getById(promoId);
      } catch (err) {
        console.error('[DonHangService] Unable to load promotion', promoId, err?.message || err);
        continue;
      }
      if (!promo || !Array.isArray(promo.sanPhamTangVariants)) continue;

      const variants = promo.sanPhamTangVariants.map(entry => ({ ...entry }));
      let changed = false;
      const stockAdjustments = [];

      for (const consumption of entries) {
        const target = variants.find(entry => {
          const entryVariant = Number(entry.variantId ?? entry.variant_id);
          const entrySize = entry.sizeId ?? entry.size_id ?? null;
          return entryVariant === consumption.variantId &&
            ((entrySize ?? null) === (consumption.sizeBridgeId ?? null));
        });
        if (!target) continue;
        const currentQty = Number(target.quantity ?? target.limit ?? target.soLuong ?? target.so_luong ?? 0);
        if (!(currentQty > 0)) continue;
        const requestedQty = Math.max(0, Math.floor(Number(consumption.quantity) || 0));
        if (!(requestedQty > 0)) continue;
        const usedQty = Math.min(currentQty, requestedQty);
        if (!(usedQty > 0)) continue;
        const newQty = currentQty - usedQty;
        target.quantity = newQty;
        if (Object.prototype.hasOwnProperty.call(target, 'limit')) {
          target.limit = newQty;
        }
        changed = true;
        stockAdjustments.push({
          variantId: consumption.variantId,
          sizeBridgeId: consumption.sizeBridgeId,
          quantity: usedQty,
        });
      }

      if (!changed) continue;

      const allUsedUp = variants.every(entry => (Number(entry.quantity ?? entry.limit ?? 0) || 0) <= 0);
      const updatePayload = {
        sanpham_tang_variants: JSON.stringify(variants),
      };

      if (allUsedUp) {
        const nowIso = new Date().toISOString();
        const currentEnd = promo.ngayKetThuc || promo.ngayketthuc;
        if (!currentEnd || new Date(currentEnd) > new Date(nowIso)) {
          updatePayload.ngayketthuc = nowIso;
        }
      }

      try {
        await khuyenmaiRepo.update(promo.maKhuyenMai, updatePayload);
        if (stockAdjustments.length) {
          await this._deductGiftVariantStock(stockAdjustments);
        }
      } catch (err) {
        console.error('[DonHangService] Failed to update promotion quota', promoId, err?.message || err);
      }
    }
  }

  async _deductGiftVariantStock(adjustments = []) {
    if (!Array.isArray(adjustments) || adjustments.length === 0) return;

    const sizeTotals = new Map();
    const variantTotals = new Map();

    for (const entry of adjustments) {
      const qty = Number(entry.quantity);
      if (!(qty > 0)) continue;
      const sizeBridgeId = Number(entry.sizeBridgeId);
      if (Number.isInteger(sizeBridgeId) && sizeBridgeId > 0) {
        sizeTotals.set(sizeBridgeId, (sizeTotals.get(sizeBridgeId) || 0) + qty);
        continue;
      }
      const variantId = Number(entry.variantId);
      if (Number.isInteger(variantId) && variantId > 0) {
        variantTotals.set(variantId, (variantTotals.get(variantId) || 0) + qty);
      }
    }

    for (const [sizeBridgeId, totalQty] of sizeTotals.entries()) {
      try {
        const { data: sizeRow, error: fetchErr } = await supabase
          .from('chitietsanpham_kichthuoc')
          .select('so_luong')
          .eq('id', sizeBridgeId)
          .maybeSingle();
        if (fetchErr) {
          console.error('[DonHangService] Failed to fetch gift size stock', sizeBridgeId, fetchErr);
          continue;
        }
        if (!sizeRow) continue;
        const currentStock = Number(sizeRow.so_luong) || 0;
        const newStock = Math.max(0, currentStock - totalQty);
        if (newStock === currentStock) continue;
        const { error: updErr } = await supabase
          .from('chitietsanpham_kichthuoc')
          .update({ so_luong: newStock })
          .eq('id', sizeBridgeId);
        if (updErr) {
          console.error('[DonHangService] Failed to deduct gift size stock', sizeBridgeId, updErr);
        } else {
          console.log(`[DonHangService] Deducted gift size stock id=${sizeBridgeId}: ${currentStock} -> ${newStock}`);
        }
      } catch (err) {
        console.error('[DonHangService] Gift size stock update exception:', err?.message || err);
      }
    }

    for (const [variantId, totalQty] of variantTotals.entries()) {
      try {
        const { data: variantRow, error: fetchErr } = await supabase
          .from('chitietsanpham')
          .select('soluongton')
          .eq('machitietsanpham', variantId)
          .maybeSingle();
        if (fetchErr) {
          console.error('[DonHangService] Failed to fetch gift variant stock', variantId, fetchErr);
          continue;
        }
        if (!variantRow) continue;
        const currentStock = Number(variantRow.soluongton) || 0;
        const newStock = Math.max(0, currentStock - totalQty);
        if (newStock === currentStock) continue;
        const { error: updErr } = await supabase
          .from('chitietsanpham')
          .update({ soluongton: newStock })
          .eq('machitietsanpham', variantId);
        if (updErr) {
          console.error('[DonHangService] Failed to deduct gift variant stock', variantId, updErr);
        } else {
          console.log(`[DonHangService] Deducted gift variant stock id=${variantId}: ${currentStock} -> ${newStock}`);
        }
      } catch (err) {
        console.error('[DonHangService] Gift variant stock update exception:', err?.message || err);
      }
    }
  }

  /**
   * =======================
   * UPDATE (giữ logic cũ, chỉ thêm normalize + set NV duyệt)
   * =======================
   */
  async update(id, body) {
    const existing = await repo.getById(id);

    // NEW: map body từ FE -> payload chuẩn DB
    const payload = mapUpdateBodyToPayload(body || {}, existing);
    
    console.log('[DonHangService.update] Order:', id);
    console.log('[DonHangService.update] Body manhanvien:', body?.manhanvien, body?.maNhanVien, body?.approverId);
    console.log('[DonHangService.update] Payload manhanvien:', payload.manhanvien);

    const paymentMethod = payload.phuongthucthanhtoan || existing?.phuongthucthanhtoan;
    const incomingPaymentStatus = payload.trangthaithanhtoan;

    if (
      !payload.trangthaidonhang &&
      incomingPaymentStatus &&
      shouldAutoMoveToPickup(paymentMethod, incomingPaymentStatus) &&
      isPendingConfirmationStatus(existing?.trangthaidonhang)
    ) {
      payload.trangthaidonhang = STATUS_CHO_LAY_HANG;
    }

    // If status set to 'Đã giao', stamp delivery date so mobile can enforce return window
    if (payload.trangthaidonhang && payload.trangthaidonhang === 'Đã giao') {
      if (!payload.ngaygiaohang) payload.ngaygiaohang = new Date().toISOString();

      // Business rule: for COD orders, 'Đã giao' means 'Đã thanh toán'
      if (paymentMethod === 'COD' && !payload.trangthaithanhtoan) {
        payload.trangthaithanhtoan = 'Đã thanh toán';
      }
    }

    const updated = await repo.update(id, payload);
    console.log('[DonHangService.update] Updated manhanvien:', updated?.manhanvien);
    
    if (!updated) {
      const e = new Error('Khong tim thay don hang de cap nhat');
      e.status = 404;
      throw e;
    }

    try {
      const prevStatus = existing ? normalizeStatus(existing.trangthaidonhang || '') : '';
      const nextStatus = normalizeStatus(updated.trangthaidonhang || payload.trangthaidonhang || '');
      
      // GHI LOG: Nếu có thay đổi trạng thái hoặc nhân viên duyệt
      const statusChanged = prevStatus !== nextStatus;
      const employeeChanged = updated.manhanvien !== existing?.manhanvien;
      
      if (statusChanged || employeeChanged || payload.lydohuy) {
        await lichSuService.logStatusChange({
          madonhang: id,
          manhanvien: updated.manhanvien || payload.manhanvien || null,
          trangthaicu: existing?.trangthaidonhang || null,
          trangthaimoi: updated.trangthaidonhang || null,
          ghichu: payload.lydohuy || null,
        });
      }

      // Khi đơn mới chuyển sang 'Đã giao' lần đầu -> cộng điểm thành viên
      if (nextStatus.includes('DA GIAO') && !prevStatus.includes('DA GIAO')) {
        await membershipService.recordOrderSpending(updated);
      }

      // Khi đơn bị hủy trước khi giao -> cộng trả tồn kho
      const justCancelled =
        nextStatus.includes('DA HUY') && !prevStatus.includes('DA HUY');
      const wasDeliveredBefore = prevStatus.includes('DA GIAO');

      if (justCancelled && !wasDeliveredBefore) {
        try {
          const { data: items, error: itemsErr } = await supabase
            .from('chitietdonhang')
            .select('chitietsize_id, soluong')
            .eq('madonhang', id);

          if (itemsErr) {
            console.error('[DonHangService.update] Error fetching order items for restock:', itemsErr);
          } else if (Array.isArray(items)) {
            for (const it of items) {
              const sizeBridgeId = it.chitietsize_id;
              const quantity = Number(it.soluong) || 0;
              if (!sizeBridgeId || quantity <= 0) continue;

              const { data: sizeRow, error: fetchErr } = await supabase
                .from('chitietsanpham_kichthuoc')
                .select('so_luong')
                .eq('id', sizeBridgeId)
                .maybeSingle();

              if (fetchErr) {
                console.error('[DonHangService.update] Error fetching size stock for id', sizeBridgeId, fetchErr);
                continue;
              }

              const currentStock = Number(sizeRow?.so_luong) || 0;
              const newStock = currentStock + quantity;

              const { error: updErr } = await supabase
                .from('chitietsanpham_kichthuoc')
                .update({ so_luong: newStock })
                .eq('id', sizeBridgeId);

              if (updErr) {
                console.error('[DonHangService.update] Error restocking size id', sizeBridgeId, updErr);
              } else {
                console.log(`[DonHangService.update] Restocked size id=${sizeBridgeId}: ${currentStock} -> ${newStock}`);
              }
            }
          }
        } catch (stockErr) {
          console.error('[DonHangService.update] Restock on cancel failed:', stockErr);
        }
      }
    } catch (err) {
      console.error('[DonHangService] Membership / stock update failed:', err?.message || err);
    }

    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy đơn hàng để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá đơn hàng thành công' };
  }
}

module.exports = new DonHangService();
