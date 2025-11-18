const service = require('../services/taikhoannhanvien.service');
const NhanVienRepo = require('../repositories/nhanvien.repository');
const ChucNangRepo = require('../repositories/chucnang.repository');

// helper to authorize requester based on their chucnang.maquyen (mở rộng quyền nếu muốn)
async function authorizeRequester(req, allowedRoles = ['ADMIN']) {
  const requesterManv = req.user?.manhanvien || req.user?.maNhanVien || req.user?.manhanvien;
  if (!requesterManv) {
    const e = new Error('Không có quyền thực hiện');
    e.status = 403;
    throw e;
  }

  const requester = await NhanVienRepo.getById(requesterManv);
  if (!requester) {
    const e = new Error('Không có quyền thực hiện');
    e.status = 403;
    throw e;
  }

  const chucnang = await ChucNangRepo.getById(requester.maChucNang ?? requester.machucnang);
  const maquyen = chucnang?.maquyen ?? chucnang?.maQuyen;
  if (!allowedRoles.includes(maquyen)) {
    const e = new Error('Chỉ ' + allowedRoles.join(', ') + ' mới được thực hiện hành động này');
    e.status = 403;
    throw e;
  }

  // return the resolved chucnang and requester in case caller needs them
  return { requester, chucnang };
}

const TaiKhoanNhanVienController = {
  async getAll(req, res) {
    try {
      const data = await service.list();
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
      // mặc định chỉ ADMIN; để cho MANAGER sửa sau này, truyền ['ADMIN','MANAGER']
      await authorizeRequester(req, ['ADMIN']);
      const item = await service.create(req.body);
      res.status(201).json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  async update(req, res) {
    try {
      await authorizeRequester(req, ['ADMIN']);
      const item = await service.update(req.params.id, req.body);
      res.json(item.toJSON());
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  },

  async delete(req, res) {
    try {
      await authorizeRequester(req, ['ADMIN']);
      const result = await service.delete(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 400).json({ message: err.message });
    }
  }
};

module.exports = TaiKhoanNhanVienController;
