const repo = require('../repositories/donhang.repository');
const chitietdonhangService = require('./chitietdonhang.service');
const membershipService = require('./membership.service');
const supabase = require('../../config/db');

const normalizeStatus = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

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

    if (!error && orderItems) {
      // Basic items
      const itemsFormatted = orderItems.map(it => ({
        machitietdonhang: it.machitietdonhang,
        madonhang: it.madonhang,
        machitietsanpham: it.machitietsanpham,
        soluong: it.soluong,
        dongia: it.dongia,
      }));

      // Enrich items: variant -> product + image
      try {
        const variantIds = [...new Set(itemsFormatted.map(x => x.machitietsanpham).filter(Boolean))];
        if (variantIds.length > 0) {
          const { data: variants, error: vErr } = await supabase
            .from('chitietsanpham')
            .select('*')
            .in('machitietsanpham', variantIds);
          if (!vErr && variants) {
            const productIds = [...new Set(variants.map(v => v.masanpham).filter(Boolean))];

            const [prodRes, imgRes] = await Promise.all([
              productIds.length
                ? supabase.from('sanpham').select('*').in('masanpham', productIds)
                : Promise.resolve({ data: [], error: null }),
              supabase.from('hinhanhsanpham').select('*').in('machitietsanpham', variantIds)
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

            orderJson.items = itemsFormatted.map(it => {
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

    // Create the order first (robust to environments chưa có cột madiachi)
    const basePayload = {
      makhachhang: body.makhachhang,
      thanhtien: body.thanhtien || 0,
      phuongthucthanhtoan: body.phuongthucthanhtoan,
      trangthaithanhtoan: body.trangthaithanhtoan || 'Chưa thanh toán',
      trangthaidonhang: body.trangthaidonhang || 'Chờ xác nhận',
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

    // Persist selected shipping address snapshot into diachigiaohang (if provided)
    try {
      const providedAddress = body.diachi || body.diaChi || null;
      const providedAddressId = body.madiachi || body.maDiaChi || (providedAddress && providedAddress.madiachi);
      let resolvedAddress = null;

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

    // If items are provided, create order items
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      console.log(`[DonHangService.create] Creating ${body.items.length} order items for order ${order.madonhang}`);
      console.log(`[DonHangService.create] Items data:`, JSON.stringify(body.items, null, 2));
      
      for (const item of body.items) {
        try {
          console.log(`[DonHangService.create] Processing item:`, item);
          
          // Map field names: mobile sends machitietsanpham/soluong/dongia
          const variantId = item.machitietsanpham || item.variantId;
          const quantity = item.soluong || item.quantity;
          const price = item.dongia || item.price;
          
          console.log(`[DonHangService.create] Mapped values:`, {
            variantId,
            quantity,
            price,
            madonhang: order.madonhang
          });
          
          // Create order item
          await chitietdonhangService.taoMoi({
            madonhang: order.madonhang,
            machitietsanpham: variantId,
            soluong: quantity,
            dongia: price,
          });
          console.log(`[DonHangService.create] Created order item: variant=${variantId}, qty=${quantity}, price=${price}`);
          
          // Update stock: reduce soluongton
          const { data: variant, error: fetchError } = await supabase
            .from('chitietsanpham')
            .select('soluongton')
            .eq('machitietsanpham', variantId)
            .single();
          
          if (fetchError) {
            console.error(`[DonHangService.create] Error fetching variant ${variantId}:`, fetchError);
            continue;
          }
          
          if (variant) {
            const newStock = Math.max(0, variant.soluongton - quantity);
            const { error: updateError } = await supabase
              .from('chitietsanpham')
              .update({ soluongton: newStock })
              .eq('machitietsanpham', variantId);
            
            if (updateError) {
              console.error(`[DonHangService.create] Error updating stock for variant ${variantId}:`, updateError);
            } else {
              console.log(`[DonHangService.create] Updated stock for variant ${variantId}: ${variant.soluongton} -> ${newStock}`);
            }
          }
          
        } catch (itemError) {
          console.error(`[DonHangService.create] Error creating order item:`, itemError);
          // Continue creating other items even if one fails
        }
      }
    }

    return order;
  }

  async update(id, body) {
    const existing = await repo.getById(id);
    // If status set to '??A? giao', stamp delivery date so mobile can enforce return window
    if (body && body.trangthaidonhang && body.trangthaidonhang === '??A? giao') {
      if (!body.ngaygiaohang) body.ngaygiaohang = new Date().toISOString();
    }

    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Khong tim thay don hang de cap nhat');
      e.status = 404;
      throw e;
    }

    try {
      const prevStatus = existing ? normalizeStatus(existing.trangthaidonhang || '') : '';
      const nextStatus = normalizeStatus(updated.trangthaidonhang || body?.trangthaidonhang || '');
      if (nextStatus.includes('DA GIAO') && !prevStatus.includes('DA GIAO')) {
        await membershipService.recordOrderSpending(updated);
      }
    } catch (err) {
      console.error('[DonHangService] Membership accrual failed:', err?.message || err);
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


