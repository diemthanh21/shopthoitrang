const express = require('express');
const router = express.Router();
const supabase = require('../../config/db');
// chỉnh path theo project của bạn, với cấu trúc src/middlewares/auth.middleware.js:
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * Map 1 row hình ảnh sang format FE cần
 * DB: hinhanhsanpham(mahinhanh, machitietsanpham, duongdanhinhanh)
 */
function mapImageRow(img) {
  if (!img) return null;
  return {
    id: img.mahinhanh || img.id || 0,
    url: img.duongdanhinhanh || img.duongdan || img.url || '',
    order: 0,
  };
}

function toPositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseIdList(raw) {
  if (!raw && raw !== 0) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);
  }
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return [raw];
  }
  const str = String(raw || '').trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
    }
  } catch (_) {
    // ignore parsing error, fallback to comma split
  }
  return str
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((v) => Number.isFinite(v) && v > 0);
}

function parseGiftVariantSelections(raw) {
  if (!raw) return [];
  let source = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      source = JSON.parse(trimmed);
    } catch (_) {
      return [];
    }
  }
  if (!Array.isArray(source)) return [];

  return source
    .map((entry) => {
      const variantId = Number(
        entry?.variantId ??
          entry?.maChiTietSanPham ??
          entry?.machitietsanpham ??
          entry?.variant_id ??
          entry?.id
      );
      if (!Number.isFinite(variantId) || variantId <= 0) return null;

      const productId = Number(
        entry?.productId ??
          entry?.maSanPham ??
          entry?.product_id ??
          entry?.masanpham
      );
      const sizeIdRaw =
        entry?.sizeId ??
        entry?.kichThuocId ??
        entry?.size_id ??
        entry?.chitietsize_id ??
        entry?.machitietsanpham_kichthuoc;
      const sizeId = Number(sizeIdRaw);

      return {
        variantId,
        productId: Number.isFinite(productId) && productId > 0 ? productId : null,
        sizeId: Number.isFinite(sizeId) && sizeId > 0 ? sizeId : null,
        buyQty: toPositiveInt(
          entry?.buyQty ??
            entry?.soLuongMua ??
            entry?.so_luong_mua ??
            entry?.buy_qty,
          1
        ),
        giftQty: toPositiveInt(
          entry?.giftQty ??
            entry?.soLuongTang ??
            entry?.so_luong_tang ??
            entry?.gift_qty,
          1
        ),
      };
    })
    .filter(Boolean);
}

async function loadGiftPromotionsForProducts(productIds) {
  const promosByProduct = new Map();
  const giftVariantIds = new Set();

  if (!productIds || productIds.length === 0) {
    return { promosByProduct, giftVariantIds };
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('khuyenmai')
    .select(
      `
      makhuyenmai,
      tenchuongtrinh,
      masanpham,
      sanpham_apdung_ids,
      sanpham_tang_variants,
      ngaybatdau
    `
    )
    .lte('ngaybatdau', nowIso)
    .gte('ngayketthuc', nowIso);

  if (error) {
    console.error('[GET /cart] Failed to load active gift promotions:', error);
    return { promosByProduct, giftVariantIds };
  }

  for (const promo of data || []) {
    const giftVariants = parseGiftVariantSelections(promo.sanpham_tang_variants);
    if (!giftVariants.length) continue;

    const applyIds = new Set(parseIdList(promo.sanpham_apdung_ids));
    const singleId = Number(promo.masanpham);
    if (Number.isFinite(singleId) && singleId > 0) {
      applyIds.add(singleId);
    }

    const matchingProductIds = productIds.filter((pid) => applyIds.has(pid));
    if (!matchingProductIds.length) continue;

    const promoLabel =
      promo.tenchuongtrinh ?? promo.tenChuongTrinh ?? 'Khuyến mãi';

    const promoStartTime = Date.parse(promo.ngaybatdau) || Date.now();

    for (const pid of matchingProductIds) {
      const existingList = promosByProduct.get(pid) ?? [];
      const existingStart = existingList[0]?.promoStartTime ?? -Infinity;
      if (promoStartTime >= existingStart) {
        promosByProduct.set(pid, [
          {
            promoId: promo.makhuyenmai,
            promoLabel,
            giftVariants,
            promoStartTime,
          },
        ]);
      }
    }

    giftVariants.forEach((entry) => {
      if (entry.variantId) giftVariantIds.add(entry.variantId);
    });
  }

  return { promosByProduct, giftVariantIds };
}

async function loadGiftVariantDetails(variantIds) {
  const result = new Map();
  if (!variantIds || variantIds.length === 0) return result;

  const { data, error } = await supabase
    .from('chitietsanpham')
    .select(
      `
      machitietsanpham,
      mausac,
      sanpham:sanpham(
        masanpham,
        tensanpham
      ),
      hinhanhsanpham:hinhanhsanpham(
        mahinhanh,
        duongdanhinhanh
      ),
      chitietsanpham_kichthuoc(
        id,
        kichthuoc:kichthuocs(
          makichthuoc,
          ten_kichthuoc
        )
      )
    `
    )
    .in('machitietsanpham', variantIds);

  if (error) {
    console.error('[GET /cart] Failed to load gift variant details:', error);
    return result;
  }

  for (const row of data || []) {
    const sizeNameByBridge = new Map();
    if (Array.isArray(row.chitietsanpham_kichthuoc)) {
      row.chitietsanpham_kichthuoc.forEach((bridge) => {
        if (!bridge || bridge.id == null) return;
        const sizeName =
          bridge.kichthuoc?.ten_kichthuoc ??
          bridge.kichthuoc?.tenKichThuoc ??
          bridge.ten_kichthuoc ??
          null;
        sizeNameByBridge.set(Number(bridge.id), sizeName);
      });
    }

    let imageUrl = null;
    if (Array.isArray(row.hinhanhsanpham) && row.hinhanhsanpham.length > 0) {
      const mapped = mapImageRow(row.hinhanhsanpham[0]);
      if (mapped?.url) imageUrl = mapped.url;
    }

    result.set(row.machitietsanpham, {
      productName: row.sanpham?.tensanpham ?? 'Sản phẩm tặng',
      color: row.mausac,
      imageUrl,
      sizeNameByBridge,
    });
  }

  return result;
}

async function loadGiftSelections(itemIds) {
  const selections = new Map();
  if (!itemIds || itemIds.length === 0) {
    return selections;
  }

  const { data, error } = await supabase
    .from('cart_gift_selection')
    .select('machitietdonhang, gift_variant_id, gift_size_bridge_id')
    .in('machitietdonhang', itemIds);

  if (error) {
    console.error('[GET /cart] Failed to load gift selections:', error);
    return selections;
  }

  (data || []).forEach((row) => {
    selections.set(row.machitietdonhang, {
      variantId: row.gift_variant_id ? Number(row.gift_variant_id) : null,
      sizeBridgeId:
        row.gift_size_bridge_id != null
          ? Number(row.gift_size_bridge_id)
          : null,
    });
  });

  return selections;
}

/**
 * Tính giá cuối cùng cho 1 sản phẩm dựa trên khuyến mãi
 * - basePrice: giaban từ chitietsanpham
 * - productId: masanpham
 * Đọc bảng khuyenmai:
 *   - ngaybatdau <= hôm nay <= ngayketthuc
 *   - áp dụng cho masanpham hoặc có trong sanpham_apdung_ids
 *   - dùng tylegiam nếu có (10 => 10% hoặc 0.1 => 10%)
 */
async function computeFinalPriceWithPromotion(basePrice, productId) {
  let finalPrice = Number(basePrice ?? 0);
  if (!productId || finalPrice <= 0) return finalPrice;

  const nowIso = new Date().toISOString();

  const { data: promos, error } = await supabase
    .from('khuyenmai')
    .select(
      `
      makhuyenmai,
      masanpham,
      tylegiam,
      sanpham_apdung_ids,
      ngaybatdau,
      ngayketthuc
    `
    )
    .lte('ngaybatdau', nowIso)
    .gte('ngayketthuc', nowIso);

  if (error || !promos || promos.length === 0) {
    return finalPrice;
  }

  const matched = promos.find((p) => {
    if (p.masanpham && p.masanpham === productId) return true;
    if (p.sanpham_apdung_ids) {
      const ids = String(p.sanpham_apdung_ids)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      return ids.includes(productId);
    }
    return false;
  });

  if (!matched || matched.tylegiam == null) return finalPrice;

  let discount = Number(matched.tylegiam);
  if (Number.isNaN(discount) || discount === 0) return finalPrice;

  // Hỗ trợ cả kiểu 10 (10%) lẫn 0.1 (10%)
  if (discount > 1) discount = discount / 100;

  finalPrice = Math.round(finalPrice * (1 - discount));
  return finalPrice;
}

async function refreshCartItemPrices(rawItems, fallbackOrderId) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return;

  const priceCache = new Map();
  const updates = [];

  for (const item of rawItems) {
    const variant = item?.chitietsanpham;
    const sizeBridge = item?.chitietsize;
    if (!variant) continue;

    const basePrice = Number(variant.giaban ?? 0);
    const productId = Number(variant.masanpham);
    if (!productId || !Number.isFinite(basePrice) || basePrice <= 0) continue;

    const cacheKey = `${productId}:${basePrice}`;
    let computedPrice = priceCache.get(cacheKey);
    if (computedPrice === undefined) {
      computedPrice = await computeFinalPriceWithPromotion(basePrice, productId);
      if (!Number.isFinite(computedPrice) || computedPrice <= 0) {
        computedPrice = basePrice;
      }
      priceCache.set(cacheKey, computedPrice);
    }

    const storedPrice =
      item.dongia !== null && item.dongia !== undefined
        ? Number(item.dongia)
        : basePrice;

    if (!Number.isFinite(storedPrice)) continue;

    if (Math.abs(storedPrice - computedPrice) > 0.0001) {
      const machitietdonhang = item.machitietdonhang;
      const madonhang = item.madonhang ?? fallbackOrderId ?? null;
      const machitietsanpham =
          item.machitietsanpham ??
          variant.machitietsanpham ??
          sizeBridge?.machitietsanpham ??
          null;
      const soluong = item.soluong ?? 0;

      if (!machitietdonhang || !madonhang || !machitietsanpham || !soluong) {
        console.warn(
          '[GET /cart] Skip price refresh due to missing required fields',
          machitietdonhang
        );
        continue;
      }

      updates.push({
        machitietdonhang,
        madonhang,
        machitietsanpham,
        soluong,
        dongia: computedPrice,
      });
      item.dongia = computedPrice;
    }
  }

  if (!updates.length) return;

  const { error } = await supabase
    .from('chitietdonhang')
    .upsert(updates, { onConflict: 'machitietdonhang' });

  if (error) {
    console.error('[GET /cart] Failed to refresh cart prices:', error);
  }
}

/**
 * Đảm bảo luôn có 1 "giỏ hàng" (donhang) trạng thái GIOHANG cho user
 * Bảng donhang:
 *  madonhang, makhachhang, trangthaidonhang, ...
 */
async function fetchNextOrderId() {
  const { data, error } = await supabase
    .from('donhang')
    .select('madonhang')
    .order('madonhang', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[GET CART] Lỗi lấy max madonhang:', error);
    return Date.now();
  }

  const currentMax = Number(data?.madonhang) || 0;
  return currentMax + 1;
}

async function insertCartOrder(userId, overrideId) {
  const payload = {
    makhachhang: userId,
    thanhtien: 0,
    trangthaidonhang: 'cart',
  };
  if (overrideId) {
    payload.madonhang = overrideId;
  }

  return supabase
    .from('donhang')
    .insert(payload)
    .select('madonhang')
    .single();
}

async function fetchNextCartItemId() {
  const { data, error } = await supabase
    .from('chitietdonhang')
    .select('machitietdonhang')
    .order('machitietdonhang', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[POST /cart/add] L?i l?y max machitietdonhang:', error);
    return Date.now();
  }

  const currentMax = Number(data?.machitietdonhang) || 0;
  return currentMax + 1;
}

async function buildCartItemPayload({
  cartId,
  variantId,
  quantity,
  unitPrice,
  chitietsizeId,
  overrideId,
}) {
  const payload = {
    madonhang: cartId,
    machitietsanpham: variantId,
    soluong: quantity,
    dongia: unitPrice,
    chitietsize_id: chitietsizeId ?? null,
  };
  if (overrideId) {
    payload.machitietdonhang = overrideId;
  }
  return payload;
}

async function getOrCreateCartForUser(userId) {
  const { data: existingOrders, error: existingError } = await supabase
    .from('donhang')
    .select('madonhang, makhachhang, trangthaidonhang')
    .eq('makhachhang', userId)
    .eq('trangthaidonhang', 'cart')
    .order('madonhang', { ascending: false })
    .limit(1);

  if (existingError) {
    console.error('[GET CART] Lỗi tìm đơn hàng hiện tại:', existingError);
    throw existingError;
  }

  if (existingOrders && existingOrders.length > 0) {
    return existingOrders[0].madonhang;
  }

  let attempt = 0;
  while (attempt < 3) {
    attempt++;
    const overrideId = attempt === 1 ? null : await fetchNextOrderId();
    const { data: newOrder, error: createError } = await insertCartOrder(
      userId,
      overrideId
    );

    if (!createError && newOrder?.madonhang) {
      return newOrder.madonhang;
    }

    if (createError?.code !== '23505') {
      console.error('[GET CART] Lỗi tạo đơn hàng mới:', createError);
      throw createError;
    }

    console.warn(
      '[GET CART] Trùng khóa madonhang khi tạo cart, thử lại với ID mới'
    );
  }

  throw new Error('Không thể tạo giỏ hàng mới cho người dùng');
}

/**
 * GET /api/cart
 * Lấy giỏ hàng hiện tại
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Vui lòng đăng nhập trước khi xem giỏ hàng' });
    }

    const rawUserId =
      req.user.id || req.user.userId || req.user.makhachhang || req.user.user_id;
    const userId = parseInt(rawUserId, 10);

    if (!userId || Number.isNaN(userId)) {
      console.error('[GET /cart] userId không hợp lệ:', rawUserId);
      return res.status(400).json({ message: 'Người dùng không hợp lệ' });
    }

    const cartId = await getOrCreateCartForUser(userId);

    const { data: itemsRes, error: itemsError } = await supabase
      .from('chitietdonhang')
      .select(
        `
        machitietdonhang,
        madonhang,
        soluong,
        dongia,
        chitietsize_id,
        chitietsize:chitietsanpham_kichthuoc(
          id,
          machitietsanpham,
          so_luong,
          kichthuoc:kichthuocs(
            makichthuoc,
            ten_kichthuoc
          )
        ),
        chitietsanpham:chitietsanpham(
          machitietsanpham,
          masanpham,
          mausac,
          chatlieu,
          mota,
          giaban,
          hinhanhsanpham:hinhanhsanpham(
            mahinhanh,
            duongdanhinhanh
          ),
          sanpham:sanpham(
            masanpham,
            tensanpham
          )
        )
      `
      )
      .eq('madonhang', cartId);

    if (itemsError) {
      console.error('[GET /cart] Lỗi lấy chitietdonhang:', itemsError);
      return res.status(500).json({ message: 'Lỗi khi lấy giỏ hàng' });
    }

    const rawItems = itemsRes || [];
    await refreshCartItemPrices(rawItems, cartId);
    const itemIds = rawItems
      .map((row) => Number(row?.machitietdonhang))
      .filter((id) => Number.isFinite(id) && id > 0);
    const giftSelections = await loadGiftSelections(itemIds);
    const invalidGiftSelectionIds = [];
    const productIds = Array.from(
      new Set(
        rawItems
          .map((row) => Number(row?.chitietsanpham?.masanpham))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );
    const { promosByProduct, giftVariantIds } = await loadGiftPromotionsForProducts(
      productIds
    );
    const giftVariantDetails = await loadGiftVariantDetails(
      Array.from(giftVariantIds)
    );

    let total = 0;

    const items = rawItems.map((row) => {
      const variant = row.chitietsanpham || {};
      const sizeBridge = row.chitietsize || null;
      const sizeInfo = sizeBridge?.kichthuoc || null;

      // ✅ GIÁ TRONG GIỎ: lấy trực tiếp từ dongia (đã là giá sau KM)
      let finalPrice;
      if (row.dongia !== null && row.dongia !== undefined) {
        finalPrice = Number(row.dongia);
      } else {
        finalPrice = Number(variant.giaban ?? 0);
      }

      const quantity = row.soluong || 0;

      // Giá gốc & % giảm để hiển thị
      const basePrice = Number(variant.giaban ?? 0);
      let originalPrice = null;
      let discountPercent = null;
      let promotionType = null;
      let promotionLabel = null;

      if (basePrice > 0 && basePrice > finalPrice) {
        originalPrice = basePrice;
        discountPercent = Math.round(
          ((basePrice - finalPrice) / basePrice) * 100
        );
        promotionType = 'PERCENT_DISCOUNT';
        promotionLabel = `Giảm ${discountPercent}%`;
      }

      total += finalPrice * quantity;

      const images = Array.isArray(variant.hinhanhsanpham)
        ? variant.hinhanhsanpham.map(mapImageRow).filter((x) => !!x)
        : [];

      const sizeName =
        sizeInfo?.ten_kichthuoc ||
        sizeInfo?.tenkichthuoc ||
        null;

      const variantForClient = {
        id: variant.machitietsanpham,
        productId: variant.masanpham,
        size: sizeName,
        color: variant.mausac,
        price: finalPrice,
        stock: sizeBridge?.so_luong ?? 0,
        images,
        product: {
          id: variant.sanpham?.masanpham,
          name: variant.sanpham?.tensanpham,
        },
      };

      const productId = Number(variant.masanpham);
      const availableGiftOptions = [];
      const selection = giftSelections.get(row.machitietdonhang) || null;
      let selectedGiftVariantId = selection?.variantId ?? null;
      let selectedGiftSizeBridgeId = selection?.sizeBridgeId ?? null;
      let giftProduct = null;
      let fallbackGiftEntry = null;
      let fallbackGiftInfo = null;
      let fallbackPromoLabel = null;
      let eligibleGiftUnits = 0;

      const promoList =
        productId && promosByProduct.has(productId)
          ? promosByProduct.get(productId) || []
          : [];

      if (!promoList.length) {
        if (selection) {
          invalidGiftSelectionIds.push(row.machitietdonhang);
          giftSelections.delete(row.machitietdonhang);
          selectedGiftVariantId = null;
          selectedGiftSizeBridgeId = null;
        }
      } else {
        for (const promo of promoList) {
          for (const giftEntry of promo.giftVariants) {
            const buyQty = Math.max(1, giftEntry.buyQty || 1);
            const giftQty = Math.max(1, giftEntry.giftQty || 1);
            const eligibleUnitsForEntry =
              Math.floor(quantity / buyQty) * giftQty;
            if (eligibleUnitsForEntry <= 0) {
              continue;
            }

            const giftVariantInfo = giftVariantDetails.get(giftEntry.variantId);
            if (!giftVariantInfo) continue;

            if (!fallbackGiftEntry) {
              fallbackGiftEntry = giftEntry;
              fallbackPromoLabel = promo.promoLabel;
              fallbackGiftInfo = giftVariantInfo;
            }

            eligibleGiftUnits = Math.max(eligibleGiftUnits, eligibleUnitsForEntry);

            const sizeNameForGift =
              giftEntry.sizeId &&
              giftVariantInfo.sizeNameByBridge?.get(giftEntry.sizeId);
            const labelParts = [];
            if (giftVariantInfo.color) {
              labelParts.push(giftVariantInfo.color);
            }
            if (sizeNameForGift) {
              labelParts.push(sizeNameForGift);
            }
            const variantLabelText =
              labelParts.length ? labelParts.join(' - ') : null;

            availableGiftOptions.push({
              promoId: promo.promoId,
              promoLabel: promo.promoLabel,
              variantId: giftEntry.variantId,
              productId: giftEntry.productId,
              sizeBridgeId: giftEntry.sizeId ?? null,
              sizeLabel: sizeNameForGift ?? null,
              color: giftVariantInfo.color ?? null,
              imageUrl: giftVariantInfo.imageUrl ?? null,
              productName: giftVariantInfo.productName,
              label: variantLabelText,
              buyQty,
              giftQty,
              eligibleQuantity: eligibleUnitsForEntry,
            });

            const matchesSelection =
              selectedGiftVariantId &&
              giftEntry.variantId === selectedGiftVariantId &&
              (giftEntry.sizeId ?? null) ===
                (selectedGiftSizeBridgeId ?? null);

            const shouldPick =
              matchesSelection || (!giftProduct && !selectedGiftVariantId);

            if (shouldPick) {
              giftProduct = {
                id: giftEntry.variantId,
                name: giftVariantInfo.productName,
                variantLabel: variantLabelText,
                imageUrl: giftVariantInfo.imageUrl,
              };
              promotionType = 'BUY_X_GET_Y';
              promotionLabel = promo.promoLabel;

              if (matchesSelection) {
                break;
              }
            }
          }

          if (
            giftProduct &&
            selectedGiftVariantId &&
            giftProduct.id === selectedGiftVariantId
          ) {
            break;
          }
        }

        if (eligibleGiftUnits === 0) {
          if (selection) {
            invalidGiftSelectionIds.push(row.machitietdonhang);
            giftSelections.delete(row.machitietdonhang);
          }
          selectedGiftVariantId = null;
          selectedGiftSizeBridgeId = null;
          giftProduct = null;
        } else if (!giftProduct && fallbackGiftEntry && fallbackGiftInfo) {
          const sizeNameForFallback =
            fallbackGiftEntry.sizeId &&
            fallbackGiftInfo.sizeNameByBridge?.get(fallbackGiftEntry.sizeId);
          const fallbackLabelParts = [];
          if (fallbackGiftInfo.color) {
            fallbackLabelParts.push(fallbackGiftInfo.color);
          }
          if (sizeNameForFallback) {
            fallbackLabelParts.push(sizeNameForFallback);
          }

          giftProduct = {
            id: fallbackGiftEntry.variantId,
            name: fallbackGiftInfo.productName,
            variantLabel:
              fallbackLabelParts.length
                ? fallbackLabelParts.join(' - ')
                : null,
            imageUrl: fallbackGiftInfo.imageUrl,
          };
          promotionType = 'BUY_X_GET_Y';
          promotionLabel = fallbackPromoLabel ?? promotionLabel;
          if (!selectedGiftVariantId) {
            selectedGiftVariantId = fallbackGiftEntry.variantId;
            selectedGiftSizeBridgeId = fallbackGiftEntry.sizeId ?? null;
          }
        }
      }
      const resolvedGiftVariantId =
        selectedGiftVariantId ?? giftProduct?.id ?? null;
      const resolvedGiftSizeBridgeId =
        selectedGiftSizeBridgeId ??
        (giftProduct && fallbackGiftEntry
          ? fallbackGiftEntry.sizeId ?? null
          : null);

      return {
        id: row.machitietdonhang,
        variantId: variant.machitietsanpham,
        quantity,
        price: finalPrice,
        sizeBridgeId: row.chitietsize_id || sizeBridge?.id || null,
        variant: variantForClient,

        originalPrice,
        discountPercent,
        promotionType,
        promotionLabel,
        giftProduct,
        giftOptions: availableGiftOptions,
        selectedGiftVariantId: resolvedGiftVariantId,
        selectedGiftSizeBridgeId: resolvedGiftSizeBridgeId,

        // raw fields
        machitietdonhang: row.machitietdonhang,
        madonhang: row.madonhang,
        dongia: finalPrice,
        chitietsize_id: row.chitietsize_id,
        chitietsize: row.chitietsize,
        chitietsanpham: variant,
      };
    });

    if (invalidGiftSelectionIds.length) {
      const { error: clearGiftError } = await supabase
        .from('cart_gift_selection')
        .delete()
        .in('machitietdonhang', invalidGiftSelectionIds);
      if (clearGiftError) {
        console.error(
          '[GET /cart] Failed to clear stale gift selections:',
          clearGiftError
        );
      }
    }

    await supabase
      .from('donhang')
      .update({ thanhtien: total })
      .eq('madonhang', cartId);

    return res.json({
      cartId,
      items,
      total,
      itemCount: items.length,
    });
  } catch (err) {
    console.error('[GET /cart] Lỗi không xác định:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy giỏ hàng' });
  }
});

/**
 * POST /api/cart/add
 * body: { variantId, quantity, price, chitietsizeId? }
 *  - price từ FE sẽ **bị bỏ qua**, server tự tính giá dựa trên khuyến mãi
 */
router.post('/add', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Vui lòng đăng nhập trước khi thêm vào giỏ' });
    }

    const rawUserId =
      req.user.id || req.user.userId || req.user.makhachhang || req.user.user_id;
    const userId = parseInt(rawUserId, 10);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Người dùng không hợp lệ' });
    }

    const { variantId, quantity = 1, chitietsizeId } = req.body;
    const normalizedSizeIdRaw =
      chitietsizeId === undefined ? null : chitietsizeId;
    const parsedSizeId =
      normalizedSizeIdRaw === null || normalizedSizeIdRaw === ''
        ? null
        : Number.parseInt(normalizedSizeIdRaw, 10);
    const normalizedSizeId =
      Number.isFinite(parsedSizeId) && parsedSizeId > 0 ? parsedSizeId : null;

    if (!variantId) {
      return res
        .status(400)
        .json({ message: 'Thiếu variantId khi thêm vào giỏ' });
    }

    const qty = parseInt(quantity, 10) || 1;

    const cartId = await getOrCreateCartForUser(userId);

    // Lấy thông tin chi tiết sản phẩm để tính giá & khuyến mãi
    const { data: variantRow, error: variantError } = await supabase
      .from('chitietsanpham')
      .select(
        `
        machitietsanpham,
        masanpham,
        giaban
      `
      )
      .eq('machitietsanpham', variantId)
      .single();

    if (variantError || !variantRow) {
      console.error(
        '[POST /cart/add] Không tìm thấy chitietsanpham:',
        variantError
      );
      return res.status(400).json({ message: 'Sản phẩm không tồn tại' });
    }

    const basePrice = Number(variantRow.giaban ?? 0);
    const productId = variantRow.masanpham;

    // 🔥 TỰ TÍNH GIÁ SAU KHUYẾN MÃI
    const unitPrice = await computeFinalPriceWithPromotion(basePrice, productId);

    // Kiểm tra đã có item cùng variant + size chưa
    const existingItemsQuery = supabase
      .from('chitietdonhang')
      .select('machitietdonhang, soluong')
      .eq('madonhang', cartId)
      .eq('machitietsanpham', variantId)
      .limit(1);

    if (normalizedSizeId === null) {
      existingItemsQuery.is('chitietsize_id', null);
    } else {
      existingItemsQuery.eq('chitietsize_id', normalizedSizeId);
    }

    const { data: existingItems, error: existingError } = await existingItemsQuery;

    if (existingError) {
      console.error(
        '[POST /cart/add] Lỗi kiểm tra item tồn tại:',
        existingError
      );
      return res.status(500).json({ message: 'Lỗi khi thêm vào giỏ hàng' });
    }

    let newQuantity = qty;

    if (existingItems && existingItems.length > 0) {
      const current = existingItems[0];
      newQuantity = (current.soluong || 0) + qty;

      const { error: updateError } = await supabase
        .from('chitietdonhang')
        .update({
          soluong: newQuantity,
          dongia: unitPrice, // LUÔN cập nhật theo giá đã tính KM
        })
        .eq('machitietdonhang', current.machitietdonhang);

      if (updateError) {
        console.error(
          '[POST /cart/add] Lỗi update chitietdonhang:',
          updateError
        );
        return res.status(500).json({ message: 'Không thể cập nhật giỏ hàng' });
      }
    } else {
      let attempt = 0;
      let lastInsertError = null;

      while (attempt < 3) {
        attempt++;
        const overrideId = attempt === 1 ? null : await fetchNextCartItemId();
        const payload = await buildCartItemPayload({
          cartId,
          variantId,
          quantity: newQuantity,
          unitPrice,
          chitietsizeId: normalizedSizeId,
          overrideId,
        });

        const { error: insertError } = await supabase
          .from('chitietdonhang')
          .insert(payload);

        if (!insertError) {
          lastInsertError = null;
          break;
        }

        lastInsertError = insertError;

        if (insertError.code !== '23505') {
          break;
        }

        console.warn(
          '[POST /cart/add] Trùng khóa machitietdonhang, thử lại với ID mới'
        );
      }

      if (lastInsertError) {
        console.error(
          '[POST /cart/add] Lỗi insert chitietdonhang:',
          lastInsertError
        );
        return res.status(500).json({ message: 'Không thể thêm vào giỏ hàng' });
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[POST /cart/add] Lỗi không xác định:', err);
    return res
      .status(500)
      .json({ message: 'Lỗi máy chủ khi thêm vào giỏ hàng' });
  }
});

/**
 * PUT /api/cart/gift/:itemId
 * body: { variantId, sizeBridgeId? }
 * Cho phép người dùng chọn quà tặng cụ thể cho item (mua x tặng y)
 */
router.put('/gift/:itemId', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Vui lòng đăng nhập trước khi đổi quà tặng' });
    }

    const rawUserId =
      req.user.id || req.user.userId || req.user.makhachhang || req.user.user_id;
    const userId = parseInt(rawUserId, 10);
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Người dùng không hợp lệ' });
    }

    const itemId = parseInt(req.params.itemId, 10);
    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ message: 'itemId không hợp lệ' });
    }

    const variantId = Number(req.body?.variantId);
    if (!Number.isFinite(variantId) || variantId <= 0) {
      return res.status(400).json({ message: 'variantId quà tặng không hợp lệ' });
    }

    const rawSize =
      req.body?.sizeBridgeId ??
      req.body?.chitietsizeId ??
      req.body?.giftSizeBridgeId ??
      null;
    const parsedSize =
      rawSize === null || rawSize === undefined || rawSize === ''
        ? null
        : Number(rawSize);
    const sizeBridgeId =
      Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : null;

    const cartId = await getOrCreateCartForUser(userId);

    const { data: itemRow, error: itemError } = await supabase
      .from('chitietdonhang')
      .select(
        `
        machitietdonhang,
        madonhang,
        machitietsanpham,
        chitietsanpham(
          masanpham
        )
      `
      )
      .eq('machitietdonhang', itemId)
      .maybeSingle();

    if (itemError || !itemRow) {
      console.error('[PUT /cart/gift] Không tìm thấy item:', itemError);
      return res.status(404).json({ message: 'Item không tồn tại' });
    }

    if (itemRow.madonhang !== cartId) {
      return res
        .status(403)
        .json({ message: 'Bạn không có quyền đổi quà cho item này' });
    }

    const productId = Number(itemRow.chitietsanpham?.masanpham);
    if (!productId || Number.isNaN(productId)) {
      return res
        .status(400)
        .json({ message: 'Không xác định được sản phẩm áp dụng khuyến mại' });
    }

    const { promosByProduct } = await loadGiftPromotionsForProducts([productId]);
    const promoList = promosByProduct.get(productId) || [];
    if (!promoList.length) {
      return res
        .status(400)
        .json({ message: 'Sản phẩm này không có quà tặng để đổi' });
    }

    let isAllowed = false;
    for (const promo of promoList) {
      for (const giftEntry of promo.giftVariants) {
        if (giftEntry.variantId !== variantId) continue;
        const requiredSize = giftEntry.sizeId ?? null;
        if ((requiredSize ?? null) === (sizeBridgeId ?? null)) {
          isAllowed = true;
          break;
        }
        // Nếu promo không bắt buộc size thì cho phép bất kỳ size
        if (requiredSize == null) {
          isAllowed = true;
          break;
        }
      }
      if (isAllowed) break;
    }

    if (!isAllowed) {
      return res.status(400).json({
        message: 'Quà tặng đã chọn không thuộc chương trình khuyến mãi hiện tại',
      });
    }

    const payload = {
      machitietdonhang: itemId,
      gift_variant_id: variantId,
      gift_size_bridge_id: sizeBridgeId,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('cart_gift_selection')
      .upsert(payload, { onConflict: 'machitietdonhang' });

    if (upsertError) {
      console.error('[PUT /cart/gift] Lỗi lưu quà tặng:', upsertError);
      return res.status(500).json({ message: 'Không thể lưu lựa chọn quà tặng' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[PUT /cart/gift] Lỗi không xác định:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ khi đổi quà tặng' });
  }
});

/**
 * PUT /api/cart/update/:itemId
 * body: { quantity }
 */
router.put('/update/:itemId', authMiddleware, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const quantity = parseInt(req.body.quantity, 10);

    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ message: 'itemId không hợp lệ' });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Số lượng phải >= 1' });
    }

    const { error } = await supabase
      .from('chitietdonhang')
      .update({ soluong: quantity })
      .eq('machitietdonhang', itemId);

    if (error) {
      console.error('[PUT /cart/update] Lỗi cập nhật số lượng:', error);
      return res.status(500).json({ message: 'Không thể cập nhật số lượng' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[PUT /cart/update] Lỗi không xác định:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

/**
 * DELETE /api/cart/remove/:itemId
 */
router.delete('/remove/:itemId', authMiddleware, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ message: 'itemId không hợp lệ' });
    }

    const { error } = await supabase
      .from('chitietdonhang')
      .delete()
      .eq('machitietdonhang', itemId);

    if (error) {
      console.error('[DELETE /cart/remove] Lỗi xóa item:', error);
      return res
        .status(500)
        .json({ message: 'Không thể xóa sản phẩm khỏi giỏ' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /cart/remove] Lỗi không xác định:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

/**
 * DELETE /api/cart/clear
 */
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Vui lòng đăng nhập trước khi xóa giỏ hàng' });
    }

    const rawUserId =
      req.user.id || req.user.userId || req.user.makhachhang || req.user.user_id;
    const userId = parseInt(rawUserId, 10);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Người dùng không hợp lệ' });
    }

    const cartId = await getOrCreateCartForUser(userId);

    const { error } = await supabase
      .from('chitietdonhang')
      .delete()
      .eq('madonhang', cartId);

    if (error) {
      console.error('[DELETE /cart/clear] Lỗi xóa giỏ hàng:', error);
      return res.status(500).json({ message: 'Không thể xóa giỏ hàng' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /cart/clear] Lỗi không xác định:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
