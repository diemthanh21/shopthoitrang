import api from './api';

const diachikhachhangService = {
  getByMaKH: async (makhachhang) => {
  const response = await api.get(`/diachikhachhang/khachhang/${makhachhang}`);
    return response.data;
  },

  create: async (data) => {
  const response = await api.post('/diachikhachhang', {
      makhachhang: data.makhachhang,
      diachi: data.diachi,
      tennguoinhan: data.tennguoinhan,
      sodienthoai: data.sodienthoai
    });
    return response.data;
  },

  update: async (madiachi, data) => {
  const response = await api.put(`/diachikhachhang/${madiachi}`, {
      makhachhang: data.makhachhang,
      diachi: data.diachi,
      tennguoinhan: data.tennguoinhan,
      sodienthoai: data.sodienthoai
    });
    return response.data;
  },

  delete: async (madiachi) => {
  const response = await api.delete(`/diachikhachhang/${madiachi}`);
    return response.data;
  }
};

export default diachikhachhangService;