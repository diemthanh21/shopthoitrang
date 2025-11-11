const service = require('../services/doihang.service');

const DoiHangController = {
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

  async getByCustomer(req, res) {
    try {
      const data = await service.getByCustomer(req.params.makhachhang);
      res.json(data.map(r => r.toJSON()));
    } catch (err) {
      res.status(500).json({ message: err.message });
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
  // Workflow actions
  async accept(req, res) {
    try { const item = await service.accept(req.params.id, req.body?.diachiguihang, req.body?.huongdan || req.body?.huongdan_donggoi); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async reject(req, res) {
    try { const item = await service.reject(req.params.id, req.body?.lydo); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async markReceivedOld(req, res) {
    try { const item = await service.markReceivedOld(req.params.id); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async markInvalid(req, res) {
    try { const item = await service.markInvalid(req.params.id, req.body?.ghichu); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async markValid(req, res) {
    try { const item = await service.markValid(req.params.id); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async calcDiff(req, res) {
    try { const item = await service.calculateDiff(req.params.id); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async diffPreview(req, res) {
    try {
      const item = await service.get(req.params.id);
      const db = require('../../config/db');
      const { data: line } = await db
        .from('chitietdonhang')
        .select('dongia')
        .eq('madonhang', item.madonhang || item.maDonHang)
        .eq('machitietsanpham', item.machitietsanphamcu || item.maChiTietSanPhamCu)
        .maybeSingle();
      const { data: variantNew } = await db
        .from('chitietsanpham')
        .select('giaban')
        .eq('machitietsanpham', item.machitietsanphammoi || item.maChiTietSanPhamMoi)
        .maybeSingle();
      const giacu = Number(line?.dongia) || 0;
      const giamoi = Number(variantNew?.giaban) || 0;
      const qty = item.soluong || item.soLuong || 0;
      const chenhlech = (giamoi - giacu) * qty;
      res.json({ madoihang: item.madoihang || item.id, giacu, giamoi, qty, chenhlech });
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },
  async requestExtraPayment(req, res) {
    try { const item = await service.requestExtraPayment(req.params.id); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async confirmExtraPaid(req, res) {
    try { const item = await service.confirmExtraPaid(req.params.id); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async refundDifference(req, res) {
    try { const item = await service.refundDifference(req.params.id, req.body?.method); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async createNewOrder(req, res) {
    try { const item = await service.createNewOrder(req.params.id); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async markExchangeComplete(req, res) {
    try { const item = await service.markExchangeComplete(req.params.id); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
  async syncComplete(req, res) {
    try { const item = await service.syncComplete(req.params.id); res.json(item.toJSON()); }
    catch(err){ res.status(err.status||400).json({message:err.message}); }
  },
};

module.exports = DoiHangController;
