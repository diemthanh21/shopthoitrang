// src/services/chitietdonhang.service.js
const supabase = require("../../config/db");
const ChiTietDonHang = require("../models/chitietdonhang.model");

const TABLE = "chitietdonhang";

class ChiTietDonHangService {
  /**
   * Tạo mới 1 dòng chi tiết đơn hàng
   * @param {{ madonhang, machitietsanpham, soluong, dongia, chitietsize_id }} body
   * @returns {Promise<ChiTietDonHang>}
   */
  async taoMoi(body = {}) {
    const madonhang = Number(body.madonhang);
    const machitietsanpham = Number(body.machitietsanpham);
    const soluong = Number(body.soluong);
    const dongia = Number(body.dongia);
    const chitietsize_id_raw =
      body.chitietsize_id ??
      body.chitietsizeId ??
      body.sizeBridgeId ??
      null;
    const chitietsize_id =
      chitietsize_id_raw === null || chitietsize_id_raw === undefined
        ? null
        : Number(chitietsize_id_raw);

    if (!madonhang || !machitietsanpham) {
      const e = new Error(
        "Thiếu madonhang hoặc machitietsanpham khi tạo chi tiết đơn hàng"
      );
      e.status = 400;
      throw e;
    }
    if (!(soluong > 0)) {
      const e = new Error("Số lượng phải > 0 khi tạo chi tiết đơn hàng");
      e.status = 400;
      throw e;
    }

    const payload = {
      madonhang,
      machitietsanpham,
      soluong,
      dongia,
      chitietsize_id: Number.isFinite(chitietsize_id) ? chitietsize_id : null,
    };

    console.log("[ChiTietDonHangService.taoMoi] Insert payload:", payload);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error(
        "[ChiTietDonHangService.taoMoi] Insert error:",
        error.message || error
      );
      const e = new Error(error.message || "Không thể tạo chi tiết đơn hàng");
      e.status = 500;
      throw e;
    }

    return new ChiTietDonHang(data);
  }

  /**
   * Lấy danh sách chi tiết theo mã đơn hàng
   */
  async layTheoDon(madonhang) {
    const id = Number(madonhang);
    if (!id) return [];

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("madonhang", id);

    if (error) {
      console.error(
        "[ChiTietDonHangService.layTheoDon] Query error:",
        error.message || error
      );
      const e = new Error("Không thể tải chi tiết đơn hàng");
      e.status = 500;
      throw e;
    }

    return (data || []).map((row) => new ChiTietDonHang(row));
  }

  /**
   * Xoá toàn bộ chi tiết của 1 đơn (nếu sau này cần dùng)
   */
  async xoaTheoDon(madonhang) {
    const id = Number(madonhang);
    if (!id) return 0;

    const { error, count } = await supabase
      .from(TABLE)
      .delete({ count: "exact" })
      .eq("madonhang", id);

    if (error) {
      console.error(
        "[ChiTietDonHangService.xoaTheoDon] Delete error:",
        error.message || error
      );
      const e = new Error("Không thể xoá chi tiết đơn hàng");
      e.status = 500;
      throw e;
    }

    return count || 0;
  }

  /**
   * Xoá 1 dòng chi tiết theo khoá chính
   */
  async xoa(machitietdonhang) {
    const id = Number(machitietdonhang);
    if (!id) return 0;

    const { error, count } = await supabase
      .from(TABLE)
      .delete({ count: "exact" })
      .eq("machitietdonhang", id);

    if (error) {
      console.error(
        "[ChiTietDonHangService.xoa] Delete error:",
        error.message || error
      );
      const e = new Error("Không thể xoá chi tiết đơn hàng");
      e.status = 500;
      throw e;
    }

    return count || 0;
  }
}

module.exports = new ChiTietDonHangService();
