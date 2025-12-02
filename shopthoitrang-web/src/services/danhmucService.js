import api from './api';

const ensureArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const normalize = (record = {}) => {
  const id =
    record.madanhmuc ?? record.maDanhMuc ?? record.id ?? record.madanhmucsanpham;
  const name =
    record.tendanhmuc ?? record.tenDanhMuc ?? record.name ?? record.tendanhMuc ?? '';

  return {
    madanhmuc: id,
    maDanhMuc: id,
    tendanhmuc: name,
    tenDanhMuc: name,
  };
};

const toPayload = (data = {}) => ({
  tendanhmuc: data.tendanhmuc ?? data.tenDanhMuc ?? '',
});

const danhmucService = {
  getAll: async () => {
    const res = await api.get('/danhmucsanpham');
    return ensureArray(res.data).map(normalize);
  },

  getById: async (madanhmuc) => {
    const res = await api.get(`/danhmucsanpham/${madanhmuc}`);
    return normalize(res.data ?? {});
  },

  create: async (data) => {
    const res = await api.post('/danhmucsanpham', toPayload(data));
    return normalize(res.data ?? {});
  },

  update: async (madanhmuc, data) => {
    const res = await api.put(`/danhmucsanpham/${madanhmuc}`, toPayload(data));
    return normalize(res.data ?? {});
  },

  // delete: async (madanhmuc) => {
  //   const res = await api.delete(`/danhmucsanpham/${madanhmuc}`);
  //   return res.data;
  // },
};

export default danhmucService;
