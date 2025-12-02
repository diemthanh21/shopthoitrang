const repo = require('../repositories/phieunhapkho.repository');
const ctPhieuNhapRepo = require('../repositories/chitietphieunhap.repository');
const ctSanPhamRepo = require('../repositories/chitietsanpham.repository');
const ctSanPhamSizeRepo = require('../repositories/chitietsanphamSize.repository');
const ctPhieuDatRepo = require('../repositories/chitietphieudathang.repository');
const phieuDatRepo = require('../repositories/phieudathang.repository');
const systemlogController = require('../controllers/systemlog.controller');

const normalize = (s = '') =>
  s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Hàm đổi giờ sang UTC+7 (giờ VN) rồi trả ISO string
function toVietnamTimeIso(input) {
  const base = input ? new Date(input) : new Date();
  const ms = base.getTime() + 7 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

class PhieuNhapKhoService {
  async list(filters) {
    return repo.getAll(filters);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Khong tim thay phieu nhap kho');
      e.status = 404;
      throw e;
    }
    return item;
  }

  async create(body) {
    const required = ['manhanvien', 'maphieudathang'];
    for (const field of required) {
      if (!body[field]) {
        const e = new Error(`Thieu thong tin bat buoc: ${field}`);
        e.status = 400;
        throw e;
      }
    }

    const payload = {
      manhanvien: body.manhanvien,
      maphieudathang: body.maphieudathang,
      // luôn lưu ngaynhap theo UTC+7
      ngaynhap: toVietnamTimeIso(body.ngaynhap || undefined),
      ghichu: body.ghichu ?? null
    };

    if (body.trangthai) {
      payload.trangthai = body.trangthai;
    }

    const created = await repo.create(payload);
    
    // Tạo thông báo khi tạo phiếu nhập kho mới
    // actorId = SYSTEM để quản lý có thể nhận thông báo (filter ở frontend)
    if (created) {
      try {
        await systemlogController.createPhieuNhapKhoLog(
          created.maPhieuNhap || created.maphieunhap,
          'SYSTEM',
          'CREATED',
          'Phiếu nhập kho mới đã được tạo, chờ duyệt',
          'NHANVIEN'
        );
        console.log('✅ Created notification for new phieunhapkho');
      } catch (logErr) {
        console.error('⚠️ Failed to create notification:', logErr);
      }
    }
    
    return created;
  }

  async update(id, body) {
    try {
      // Lấy trạng thái cũ để so sánh
      const prev = await repo.getById(id);
      if (!prev) {
        const e = new Error('Khong tim thay phieu nhap kho');
        e.status = 404;
        throw e;
      }

      // Clone body để xử lý ngày nhập (cộng +7h) trước khi update
      const updateBody = { ...body };
      if (body.ngaynhap !== undefined) {
        updateBody.ngaynhap = toVietnamTimeIso(body.ngaynhap || undefined);
      }

      // Cập nhật phiếu nhập
      const updated = await repo.update(id, updateBody);
      if (!updated) {
        const e = new Error('Khong tim thay phieu nhap kho de cap nhat');
        e.status = 404;
        throw e;
      }

      // Kiểm tra trạng thái để xử lý logic duyệt
      const newStatus = (body.trangthai || updated.trangthai || updated.trangThai || '').toString();
      const oldStatus = (prev.trangthai || prev.trangThai || '').toString();
      const wasApprovedBefore = normalize(oldStatus).includes('duyet');
      const isNowApproved = normalize(newStatus).includes('duyet');

      console.log('=== RECEIPT UPDATE DEBUG ===');
      console.log('Receipt ID:', id);
      console.log('Previous Status:', oldStatus);
      console.log('New Status:', newStatus);
      console.log('Was Approved Before:', wasApprovedBefore);
      console.log('Is Now Approved:', isNowApproved);

      // Tạo log thông báo khi trạng thái thay đổi
      if (newStatus && newStatus !== oldStatus) {
        try {
          console.log('📋 Phiếu nhập kho #' + id + ' - Trạng thái thay đổi:', oldStatus, '→', newStatus);
          console.log('📋 prev.maNhanVien:', prev.maNhanVien);
          
          let action = null;
          let note = null;
          let actorType = 'ADMIN';
          let actorId = 'SYSTEM';
          
          if (isNowApproved && !wasApprovedBefore) {
            action = 'APPROVED';
            note = 'Phiếu nhập kho đã được duyệt';
            actorType = 'ADMIN';
            // actorId là nhân viên tạo phiếu - họ sẽ nhận thông báo
            actorId = String(prev.maNhanVien || prev.manhanvien || 'SYSTEM');
            console.log('📧 Sending APPROVED notification to employee:', actorId);
          } else if (normalize(newStatus).includes('huy') || normalize(newStatus).includes('choi')) {
            action = 'REJECTED';
            note = 'Phiếu nhập kho bị từ chối';
            actorType = 'ADMIN';
            // actorId là nhân viên tạo phiếu - họ sẽ nhận thông báo
            actorId = String(prev.maNhanVien || prev.manhanvien || 'SYSTEM');
            console.log('📧 Sending REJECTED notification to employee:', actorId);
          }
          
          if (action) {
            await systemlogController.createPhieuNhapKhoLog(
              id,
              actorId,
              action,
              note,
              actorType
            );
            console.log('✅ Created status update log for phieunhapkho:', id, 'action:', action, 'actorId:', actorId);
          }
        } catch (logErr) {
          console.error('⚠️ Failed to create status update log:', logErr);
        }
      }

      // Nếu vừa chuyển sang trạng thái "Đã duyệt"
      if (isNowApproved && !wasApprovedBefore) {
        await this.processApproval(id, updated);
      }

      return updated;

    } catch (e) {
      console.error('Error in phieunhapkho.update:', e.message || e);
      throw e;
    }
  }

  async processApproval(receiptId, receiptData) {
    console.log('=== PROCESSING APPROVAL ===');
    console.log('Receipt data:', receiptData);
    
    try {
      // 1) Cập nhật tồn kho
      await this.updateStock(receiptId);
      
      // 2) Kiểm tra và cập nhật trạng thái phiếu đặt hàng
      const purchaseOrderId = receiptData.maphieudathang || receiptData.maPhieuDatHang;
      console.log('Purchase order ID extracted:', purchaseOrderId);
      
      if (purchaseOrderId) {
        await this.checkPurchaseOrderCompletion(purchaseOrderId);
      } else {
        console.log('No purchase order ID found in receipt data');
      }
      
    } catch (error) {
      console.error('Error in processApproval:', error.message);
      // Không throw error để tránh crash server
    }
  }

  async updateStock(receiptId) {
    console.log('=== UPDATING STOCK ===');
    
    try {
      const allDetails = await ctPhieuNhapRepo.getAll();
      const receiptDetails = allDetails.filter(d => Number(d.maphieunhap) === Number(receiptId));

      console.log('Receipt details found:', receiptDetails.length);

      for (const detail of receiptDetails) {
        try {
          const productDetailId = detail.machitietsanpham;
          const quantity = Number(detail.soluong) || 0;
          
          if (!productDetailId || quantity <= 0) {
            console.log('Skipping invalid detail:', detail);
            continue;
          }

          console.log(`Processing product detail ID: ${productDetailId}, quantity: ${quantity}`);

          // Lấy tất cả size records cho product detail này
          const ctSanPhamSizeRepo = require('../repositories/chitietsanphamSize.repository');
          const sizeRecords = await ctSanPhamSizeRepo.listByVariant(productDetailId);
          
          console.log(`Found ${sizeRecords.length} size records for variant ${productDetailId}`);

          if (sizeRecords.length === 0) {
            console.log(`No size records found for variant ${productDetailId}. Creating default size record.`);
            
            // Tạo size record mặc định nếu chưa có
            const { error: insertError } = await require('../../config/db')
              .from('chitietsanpham_kichthuoc')
              .insert({
                machitietsanpham: productDetailId,
                makichthuoc: 1, // Default size ID
                so_luong: quantity
              });
            
            if (insertError) {
              console.error('Error creating default size record:', insertError.message);
            } else {
              console.log(`Created default size record with quantity: ${quantity}`);
            }
          } else {
            // Cập nhật size record đầu tiên (hoặc có thể cập nhật tất cả)
            const sizeRecord = sizeRecords[0];
            const currentStock = Number(sizeRecord.so_luong) || 0;
            const newStock = currentStock + quantity;
            
            const { error: updateError } = await require('../../config/db')
              .from('chitietsanpham_kichthuoc')
              .update({ so_luong: newStock })
              .eq('id', sizeRecord.id);
            
            if (updateError) {
              console.error('Error updating stock:', updateError.message);
            } else {
              console.log(`Updated stock for size ID ${sizeRecord.id}: ${currentStock} + ${quantity} = ${newStock}`);
            }
          }
          
        } catch (stockError) {
          console.error(`Error updating stock for product ${detail.machitietsanpham}:`, stockError.message);
        }
      }
    } catch (error) {
      console.error('Error in updateStock:', error.message);
    }
  }

  async checkPurchaseOrderCompletion(purchaseOrderId) {
    if (!purchaseOrderId) {
      console.log('No purchase order ID provided');
      return;
    }

    console.log('=== CHECKING PURCHASE ORDER COMPLETION ===');
    console.log('Purchase Order ID:', purchaseOrderId);

    try {
      // Lấy chi tiết đặt hàng
      const allOrderDetails = await ctPhieuDatRepo.getAll();
      const orderDetails = allOrderDetails.filter(od => Number(od.maphieudathang) === Number(purchaseOrderId));

      if (orderDetails.length === 0) {
        console.log('No order details found');
        return;
      }

      console.log('Order details found:', orderDetails.length);

      // Lấy tất cả phiếu nhập đã duyệt cho đơn hàng này
      const allReceipts = await repo.getAll();
      const receiptsForOrder = allReceipts.filter(r => {
        const rPoId = Number(r.maphieudathang || r.maPhieuDatHang || 0);
        return rPoId === Number(purchaseOrderId);
      });
      
      const approvedReceipts = receiptsForOrder.filter(r => {
        const status = (r.trangthai || r.trangThai || '').toString();
        return normalize(status).includes('duyet');
      });

      console.log('Total receipts for order:', receiptsForOrder.length);
      console.log('Receipt IDs for order:', receiptsForOrder.map(r => r.maphieunhap || r.maPhieuNhap));
      console.log('Approved receipts:', approvedReceipts.length);
      console.log('Approved receipt IDs:', approvedReceipts.map(r => r.maphieunhap || r.maPhieuNhap));

      // Tính tổng số lượng đã nhập cho từng sản phẩm
      const receivedQuantities = {};
      
      for (const receipt of approvedReceipts) {
        try {
          const receiptId = receipt.maphieunhap || receipt.maPhieuNhap;
          console.log(`Processing receipt ${receiptId} for quantity calculation`);
          
          const allReceiptDetails = await ctPhieuNhapRepo.getAll();
          const receiptDetails = allReceiptDetails.filter(d => {
            const dReceiptId = Number(d.maphieunhap || d.maPhieuNhap || 0);
            return dReceiptId === Number(receiptId);
          });
          
          console.log(`Receipt ${receiptId} has ${receiptDetails.length} detail lines`);
          
          for (const detail of receiptDetails) {
            const productId = detail.machitietsanpham;
            const quantity = Number(detail.soluong) || 0;
            
            console.log(`  Detail: product=${productId}, quantity=${quantity}`);
            
            if (productId && quantity > 0) {
              receivedQuantities[productId] = (receivedQuantities[productId] || 0) + quantity;
            }
          }
        } catch (detailError) {
          console.error(`Error processing receipt ${receipt.maphieunhap}:`, detailError.message);
        }
      }

      console.log('Received quantities:', receivedQuantities);

      // Kiểm tra xem đã đủ hàng chưa
      let allFulfilled = true;
      for (const orderDetail of orderDetails) {
        const productId = orderDetail.machitietsanpham;
        const orderedQty = Number(orderDetail.soluong) || 0;
        const receivedQty = receivedQuantities[productId] || 0;
        
        console.log(`Product ${productId}: Ordered=${orderedQty}, Received=${receivedQty}`);
        
        if (receivedQty < orderedQty) {
          allFulfilled = false;
          console.log(`Product ${productId} not fully received`);
        }
      }

      console.log('All products fulfilled:', allFulfilled);

      // Nếu đã đủ hàng, cập nhật trạng thái đơn hàng
      if (allFulfilled) {
        try {
          console.log('Updating purchase order status to Hoàn thành...');
          // Gọi service thay vì repository để trigger notification
          const phieuDatService = require('./phieudathang.service');
          const updateResult = await phieuDatService.update(purchaseOrderId, { trangthaiphieu: 'Hoàn thành' });
          console.log('Purchase order update result:', updateResult ? 'Success' : 'Failed');
        } catch (updateError) {
          console.error('Error updating purchase order status:', updateError.message);
        }
      } else {
        console.log('Purchase order not yet complete');
      }

    } catch (error) {
      console.error('Error in checkPurchaseOrderCompletion:', error.message);
    }
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Khong tim thay phieu nhap kho de xoa');
      e.status = 404;
      throw e;
    }
    return { message: 'Da xoa phieu nhap kho thanh cong' };
  }
}

module.exports = new PhieuNhapKhoService();
