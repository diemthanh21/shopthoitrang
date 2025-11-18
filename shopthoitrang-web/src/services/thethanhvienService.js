import api from './api';

const mapCard = (raw) => ({
  ...raw,
  tier: raw.hangThe || raw.tier || raw.tier_snapshot || null,
  customer: raw.customer || null,
});

const getAll = async () => {
  const res = await api.get('/thethanhvien');
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map(mapCard);
};

const getByKhachHang = async (makhachhang) => {
  const res = await api.get(`/thethanhvien/khachhang/${makhachhang}`);
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map(mapCard);
};

const getById = async (mathe) => {
  const res = await api.get(`/thethanhvien/${mathe}`);
  return mapCard(res.data);
};

const create = async (payload) => {
  const res = await api.post('/thethanhvien', payload);
  return mapCard(res.data);
};

const update = async (mathe, payload) => {
  const res = await api.put(`/thethanhvien/${mathe}`, payload);
  return mapCard(res.data);
};

const remove = async (mathe) => {
  const res = await api.delete(`/thethanhvien/${mathe}`);
  return res.data;
};

const syncAll = async () => {
  const res = await api.post('/thethanhvien/sync');
  return res.data;
};

export default {
  getAll,
  getByKhachHang,
  getById,
  create,
  update,
  delete: remove,
  syncAll,
};