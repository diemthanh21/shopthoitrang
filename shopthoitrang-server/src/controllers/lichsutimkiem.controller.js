const service = require('../services/lichsutimkiem.service');

exports.getAll = async (req, res) => {
  const result = await service.layTatCa();
  res.json(result);
};

exports.getById = async (req, res) => {
  const item = await service.layTheoMa(req.params.maLichSu);
  if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
  res.json(item);
};

exports.getByKhachHang = async (req, res) => {
  const result = await service.layTheoKhachHang(req.params.maKhachHang);
  res.json(result);
};

exports.create = async (req, res) => {
  const result = await service.taoMoi(req.body);
  if (!result) return res.status(400).json({ message: 'Tạo thất bại' });
  res.status(201).json(result);
};

exports.update = async (req, res) => {
  const result = await service.capNhat(req.params.maLichSu, req.body);
  if (!result) return res.status(400).json({ message: 'Cập nhật thất bại' });
  res.json(result);
};

exports.delete = async (req, res) => {
  const result = await service.xoa(req.params.maLichSu);
  if (!result) return res.status(400).json({ message: 'Xoá thất bại' });
  res.json(result);
};
