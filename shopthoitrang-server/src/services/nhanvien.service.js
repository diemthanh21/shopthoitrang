const repo = require("../repositories/nhanvien.repository");

class NhanVienService {
  // Lấy danh sách nhân viên (có thể có filters)
  async list(filters) {
    return repo.getAll(filters);
  }

  // Lấy chi tiết 1 nhân viên theo ID
  async get(id) {
    const item = await repo.getById(id);
    if (!item) {
      const e = new Error("Không tìm thấy nhân viên");
      e.status = 404;
      throw e;
    }
    return item;
  }

  // Tạo mới nhân viên
  async create(body) {
    // Kiểm tra bắt buộc
    if (!body.hoten || !body.machucnang) {
      const e = new Error("Thiếu thông tin bắt buộc: hoten, machucnang");
      e.status = 400;
      throw e;
    }

    // Tạo payload đầy đủ (đồng bộ với cột trong DB)
    const payload = {
      hoten: body.hoten,
      gioitinh: body.gioitinh ?? null,
      cccd: body.cccd ?? null,
      ngaycap: body.ngaycap ?? null,
      noicap: body.noicap ?? null,
      ngaybatdau: body.ngaybatdau ?? null,
      ngayhethan: body.ngayhethan ?? null,
      trangthai: body.trangthai ?? "Đang làm",
      luong: body.luong ?? 0,

      email: body.email ?? null,
      sodienthoai: body.sodienthoai ?? null,
      ngaysinh: body.ngaysinh ?? null, // ISO date
      diachi: body.diachi ?? null,
      machucnang: body.machucnang,
    };

    // Gọi repository để lưu
    return repo.create(payload);
  }

  // Cập nhật nhân viên
  async update(id, body) {
    // Có thể kiểm tra tồn tại trước khi update nếu cần
    const updated = await repo.update(id, {
      hoten: body.hoten ?? null,
      gioitinh: body.gioitinh ?? null,
      cccd: body.cccd ?? null,
      ngaycap: body.ngaycap ?? null,
      noicap: body.noicap ?? null,
      ngaybatdau: body.ngaybatdau ?? null,
      ngayhethan: body.ngayhethan ?? null,
      trangthai: body.trangthai ?? null,
      luong: body.luong ?? null,

      email: body.email ?? null,
      sodienthoai: body.sodienthoai ?? null,
      ngaysinh: body.ngaysinh ?? null,
      diachi: body.diachi ?? null,
      machucnang: body.machucnang ?? null,

    });

    if (!updated) {
      const e = new Error("Không tìm thấy nhân viên để cập nhật");
      e.status = 404;
      throw e;
    }

    return updated;
  }

  // Xoá nhân viên
  async delete(id) {
    const deleted = await repo.remove(id);
    if (!deleted) {
      const e = new Error("Không tìm thấy nhân viên để xoá");
      e.status = 404;
      throw e;
    }
    return { message: "Đã xoá nhân viên thành công" };
  }
}

module.exports = new NhanVienService();
