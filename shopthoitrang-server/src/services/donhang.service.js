const repo = require('../repositories/donhang.repository');
const chitietdonhangService = require('./chitietdonhang.service');
const supabase = require('../../config/db');

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
    return item;
  }

  async getByCustomer(makhachhang) {
    return repo.getByCustomer(makhachhang);
  }

  async create(body) {
    if (!body.makhachhang || !body.phuongthucthanhtoan) {
      const e = new Error('Thiếu thông tin bắt buộc: makhachhang, phuongthucthanhtoan');
      e.status = 400;
      throw e;
    }

    // Create the order first
    const order = await repo.create({
      makhachhang: body.makhachhang,
      thanhtien: body.thanhtien || 0,
      phuongthucthanhtoan: body.phuongthucthanhtoan,
      trangthaithanhtoan: body.trangthaithanhtoan || 'Chưa thanh toán',
      trangthaidonhang: body.trangthaidonhang || 'Đang xử lý',
    });

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
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy đơn hàng để cập nhật');
      e.status = 404;
      throw e;
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
