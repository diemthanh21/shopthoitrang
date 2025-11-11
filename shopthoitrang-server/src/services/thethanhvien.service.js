const repo = require('../repositories/thethanhvien.repository');
const hangTheRepo = require('../repositories/hangthe.repository');
const membershipWorkflow = require('./membership.workflow');
const supabase = require('../../config/db');

const addOneYear = (dateInput) => {
  const base = dateInput ? new Date(dateInput) : new Date();
  base.setFullYear(base.getFullYear() + 1);
  return base.toISOString();
};

class TheThanhVienService {
  async _enrich(records) {
    if (!records || records.length === 0) return [];

    const tiers = await hangTheRepo.getAll();
    const tierMap = new Map(tiers.map((tier) => [tier.mahangthe, tier.toJSON()]));

    const customerIds = Array.from(new Set(records.map((card) => card.maKhachHang))).filter(Boolean);
    let customerMap = new Map();
    if (customerIds.length) {
      const { data, error } = await supabase
        .from('taikhoankhachhang')
        .select('makhachhang, hoten, email, sodienthoai, tendangnhap');
      if (error) throw error;
      customerMap = new Map((data || []).map((row) => [row.makhachhang, row]));
    }

    return records.map((card) => {
      const json = card.toJSON();
      if (!json.ngayhethan && json.ngaycap) {
        json.ngayhethan = addOneYear(json.ngaycap);
      }
      const tier = tierMap.get(card.maHangThe) || null;
      if (tier) {
        json.tenhang = json.tenhang || tier.tenhang;
        json.giamgia = json.giamgia ?? tier.giamgia;
        json.voucher_sinhnhat = json.voucher_sinhnhat ?? tier.voucher_sinhnhat;
        json.uudai = json.uudai ?? tier.uudai;
      }
      return {
        ...json,
        hangThe: tier,
        customer: customerMap.get(card.maKhachHang) || null,
      };
    });
  }

  async list() {
    const cards = await repo.getAll();
    return this._enrich(cards);
  }

  async getByKhachHang(makhachhang) {
    const items = await repo.findByKhachHang(makhachhang);
    return this._enrich(items);
  }

  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error('Không tìm thấy thẻ thành viên');
      e.status = 404;
      throw e;
    }
    const [enriched] = await this._enrich([item]);
    return enriched;
  }

  async create(body) {
    if (!body.makhachhang || !body.mahangthe) {
      const e = new Error('Thiếu thông tin bắt buộc: makhachhang, mahangthe');
      e.status = 400;
      throw e;
    }

    const issuedAtDate = body.ngaycap ? new Date(body.ngaycap) : new Date();
    const ngayCapIso = issuedAtDate.toISOString();

    const payload = {
      makhachhang: body.makhachhang,
      mahangthe: body.mahangthe,
      ngaycap: ngayCapIso,
      ngayhethan: body.ngayhethan ?? addOneYear(issuedAtDate),
      trangthai: body.trangthai ?? true,
      tier_snapshot: body.tier_snapshot ?? null,
      tichluy_khi_cap: body.tichluy_khi_cap ?? 0,
    };

    return repo.create(payload);
  }

  async update(id, body) {
    const updated = await repo.update(id, body);
    if (!updated) {
      const e = new Error('Không tìm thấy thẻ thành viên để cập nhật');
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error('Không tìm thấy thẻ thành viên để xoá');
      e.status = 404;
      throw e;
    }
    return { message: 'Đã xoá thẻ thành viên thành công' };
  }

  async syncAll() {
    const { data: customers, error } = await supabase
      .from('taikhoankhachhang')
      .select('makhachhang');
    if (error) throw error;

    let created = 0;
    for (const row of customers || []) {
      const latest = await repo.findLatestActiveByKhachHang(row.makhachhang);
      if (!latest) {
        const card = await membershipWorkflow.ensureDefaultCard(row.makhachhang);
        if (card) created += 1;
      }
    }

    const totalCards = (await repo.getAll()).length;
    return {
      created,
      totalCustomers: customers?.length || 0,
      totalCards,
    };
  }
}

module.exports = new TheThanhVienService();
