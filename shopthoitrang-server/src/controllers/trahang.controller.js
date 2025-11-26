const service = require('../services/trahang.service');

const TraHangController = {
  async getAll(req, res) {
    try {
      const data = await service.list(req.query);
      res.json(data.map(r => r.toJSON()));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await service.get(req.params.id);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 404).json({ message: err.message });
    }
  },

  async create(req, res) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  async update(req, res) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const result = await service.delete(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  // --- Workflow actions ---
  async accept(req, res) {
    try {
      const item = await service.accept(
        req.params.id,
        req.body?.diachiguihang,
        req.body?.huongdan || req.body?.huongdan_donggoi
      );
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
  async reject(req, res) {
    try {
      const item = await service.reject(req.params.id, req.body?.lydo);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
  async markReceived(req, res) {
    try {
      const item = await service.markReceived(req.params.id);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
  async markInvalid(req, res) {
    try {
      const item = await service.markInvalid(req.params.id, req.body?.ghichu);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
  async markValid(req, res) {
    try {
      const item = await service.markValid(req.params.id);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
  async calcRefund(req, res) {
    try {
      const item = await service.calculateRefund(req.params.id);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
  async refundPreview(req, res) {
    try {
      const item = await service.get(req.params.id);
      // clone logic: calculate without persisting (reuses service but does not update if not eligible)
      const { data: detailRow } = await require('../../config/db')
        .from('chitietdonhang')
        .select('dongia')
        .eq('madonhang', item.maDonHang || item.madonhang)
        .eq('machitietsanpham', item.maChiTietSanPham || item.machitietsanpham)
        .maybeSingle();
      const soTien = (Number(detailRow?.dongia) || 0) * (item.soLuong || item.soluong || 0);
      res.json({ matrahang: item.maTraHang || item.id, preview_sotien_hoan: soTien });
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
  async refund(req, res) {
    try {
      // Initiate a refund: create a pending refund record and return it.
      // Actual transition to 'Đã hoàn tiền' will only occur after gateway verification
      const pending = await service.initiateRefund(req.params.id, req.user, req.body?.phuongthuc, req.body?.note);
      res.json(pending);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  // Admin confirms refund after verifying external transaction id or gateway callback
  async confirmRefund(req, res) {
    try {
      const pending = await service.confirmRefund(req.params.id, req.body?.external_txn_id, req.user);
      res.json(pending);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  // Public webhook endpoint for payment gateways to notify of refund completion
  async refundWebhook(req, res) {
    try {
      const { external_txn_id } = req.body;
      if (!external_txn_id) return res.status(400).json({ message: 'Missing external_txn_id' });
      const pending = await service.confirmRefundByExternalTxn(external_txn_id, req.body);
      res.json({ ok: true, pending });
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  async getReturnableItems(req, res) {
    try {
      const orderId = Number(
        req.query?.madonhang ??
          req.query?.maDonHang ??
          req.query?.orderId ??
          req.params?.orderId
      );
      if (!orderId || Number.isNaN(orderId)) {
        return res.status(400).json({ message: 'Thiếu tham số madonhang' });
      }
      const userRole = req.user?.role || null;
      let scopedCustomerId = null;
      if (userRole === 'customer') {
        scopedCustomerId = Number(
          req.user?.makhachhang ?? req.user?.maKhachHang ?? req.user?.customerId
        );
      } else if (req.query?.makhachhang || req.query?.maKhachHang) {
        scopedCustomerId = Number(req.query.makhachhang ?? req.query.maKhachHang);
      }

      const data = await service.getReturnableItems(orderId, scopedCustomerId, userRole);
      res.json({ data });
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  }
};

module.exports = TraHangController;
