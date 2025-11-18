const repo = require('../repositories/phieunhapkho.repository');
const ctPhieuNhapRepo = require('../repositories/chitietphieunhap.repository');
const ctSanPhamRepo = require('../repositories/chitietsanpham.repository');
const ctPhieuDatRepo = require('../repositories/chitietphieudathang.repository');
const phieuDatRepo = require('../repositories/phieudathang.repository');

const normalize = (s = '') =>
  s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

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
      ngaynhap: body.ngaynhap ?? new Date().toISOString(),
      ghichu: body.ghichu ?? null
    };

    if (body.trangthai) {
      payload.trangthai = body.trangthai;
    }

    return repo.create(payload);
  }

  async update(id, body) {
    // Lấy trạng thái cũ để so sánh (tránh chạy logic nhiều lần)
    const prev = await repo.getById(id);

    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Khong tim thay phieu nhap kho de cap nhat');
      e.status = 404;
      throw e;
    }

    try {
      const newStatus = (body.trangthai ?? updated.trangthai ?? '').toString();
      const wasApprovedBefore = prev && normalize(prev.trangthai || '').includes('duyet');
      const isNowApproved = normalize(newStatus).includes('duyet');

      console.log('=== RECEIPT UPDATE DEBUG ===');
      console.log('Receipt ID:', id);
      console.log('Previous Status:', prev ? prev.trangthai : 'N/A');
      console.log('New Status:', newStatus);
      console.log('Was Approved Before:', wasApprovedBefore);
      console.log('Is Now Approved:', isNowApproved);

      // Nếu đang chuyển sang trạng thái Đã duyệt (và trước đó chưa phải Đã duyệt)
      if (isNowApproved && !wasApprovedBefore) {
        // 1) Cộng tồn cho từng chi tiết sản phẩm trong phiếu nhập
        const allDetails = await ctPhieuNhapRepo.getAll();
        const myDetails = (allDetails || []).filter(d => Number(d.maphieunhap) === Number(id));

        console.log('My receipt details:', myDetails);

        for (const d of myDetails) {
          const maCT = d.machitietsanpham;
          const qty = Number(d.soluong) || 0;
          if (!maCT || qty <= 0) continue;

          const ct = await ctSanPhamRepo.getById(maCT);
          if (!ct) continue;

          const current = Number(ct.soluongton ?? ct.soluong ?? 0) || 0;
          const newQty = current + qty;
          await ctSanPhamRepo.update(maCT, { soluongton: newQty });
          console.log(`Updated stock for product ${maCT}: ${current} + ${qty} = ${newQty}`);
        }

        // 2) Kiểm tra phiếu đặt hàng liên quan — nếu đã nhận đủ (tính gộp tất cả phiếu nhập đã duyệt), cập nhật trạng thái phiếu đặt hàng sang 'Hoàn thành'
        const poId = updated.maphieudathang;
        console.log('Purchase Order ID from receipt:', poId);
        
        if (poId) {
          // Lấy tất cả chi tiết đặt hàng của phiếu
          const allOrderDetails = await ctPhieuDatRepo.getAll();
          const myOrderDetails = (allOrderDetails || []).filter(od => Number(od.maphieudathang) === Number(poId));

          // Lấy tất cả phiếu nhập đã duyệt cho phiếu đặt hàng này
          const allReceipts = await repo.getAll();
          const receiptsForPO = (allReceipts || []).filter(r => Number(r.maphieudathang) === Number(poId));
          const approvedReceipts = receiptsForPO.filter(r => normalize(r.trangthai || '').includes('duyet'));

          console.log('Receipts for PO:', receiptsForPO.length);
          console.log('Approved receipts:', approvedReceipts.length);

          // Tính tổng số lượng đã nhập cho từng machitietsanpham
          const receivedMap = {};
          for (const r of approvedReceipts) {
            const detailsOfR = (await ctPhieuNhapRepo.getAll()).filter(d => Number(d.maphieunhap) === Number(r.maphieunhap));
            for (const d of detailsOfR) {
              const maCT = d.machitietsanpham;
              const qty = Number(d.soluong) || 0;
              if (!maCT) continue;
              receivedMap[maCT] = (receivedMap[maCT] || 0) + qty;
            }
          }

          // So sánh từng dòng đặt hàng
          console.log('=== DEBUG AUTO COMPLETION ===');
          console.log('Purchase Order ID:', poId);
          console.log('Order Details:', myOrderDetails);
          console.log('Received Map:', receivedMap);
          
          let allFulfilled = true;
          for (const od of myOrderDetails) {
            const maCT = od.machitietsanpham;
            const ordered = Number(od.soluong) || 0;
            const received = Number(receivedMap[maCT] || 0);
            
            console.log(`Product ${maCT}: Ordered=${ordered}, Received=${received}, Fulfilled=${received >= ordered}`);
            
            if (received < ordered) {
              allFulfilled = false;
              break;
            }
          }

          console.log('All Fulfilled:', allFulfilled);

          if (allFulfilled && myOrderDetails.length > 0) {
            try {
              console.log('Updating Purchase Order status to "Hoàn thành"...');
              const updateResult = await phieuDatRepo.update(poId, { trangthaiphieu: 'Hoàn thành' });
              console.log('Update result:', updateResult);
              console.log('Successfully updated Purchase Order status!');
            } catch (e) {
              // Không block nếu cập nhật trạng thái đơn thất bại — chỉ log
              console.error('Lỗi khi cập nhật trạng thái phiếu đặt hàng sang Hoàn thành:', e.message || e);
            }
          }
        }
      }
    } catch (e) {
      console.error('Lỗi khi xử lý hậu duyệt phiếu nhập kho:', e && e.message ? e.message : e);
    }

    return updated;
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
