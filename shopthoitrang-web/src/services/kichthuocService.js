import api from "./api";

const PREFIX = "/kichthuocs";

const extractData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getAll = async () => {
  const res = await api.get(PREFIX);
  return extractData(res.data).map((item) => ({
    maKichThuoc:
      item.makichthuoc ?? item.maKichThuoc ?? item.id ?? item.ma_kich_thuoc,
    tenKichThuoc: item.ten_kichthuoc ?? item.tenKichThuoc ?? "",
    moTa: item.mo_ta ?? item.moTa ?? "",
  }));
};

const create = async (payload = {}) => {
  const res = await api.post(PREFIX, {
    ten_kichthuoc: payload.tenKichThuoc ?? payload.ten_kichthuoc,
    mo_ta: payload.moTa ?? payload.mo_ta ?? null,
  });
  return res.data;
};

const update = async (id, payload = {}) => {
  const res = await api.put(`${PREFIX}/${id}`, {
    ten_kichthuoc: payload.tenKichThuoc ?? payload.ten_kichthuoc,
    mo_ta: payload.moTa ?? payload.mo_ta ?? null,
  });
  return res.data;
};

const remove = async (id) => {
  const res = await api.delete(`${PREFIX}/${id}`);
  return res.data;
};

export default {
  getAll,
  create,
  update,
  delete: remove,
};
