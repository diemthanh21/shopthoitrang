import axios from '../configs/axios';

const diachikhachhangService = {
  getByMaKH: async (makhachhang) => {
    const response = await axios.get(`/diachikhachhang/khachhang/${makhachhang}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/diachikhachhang', {
      makhachhang: data.makhachhang,
      diachi: data.diachi,
      tennguoinhan: data.tennguoinhan,
      sodienthoai: data.sodienthoai
    });
    return response.data;
  },

  update: async (madiachi, data) => {
    const response = await axios.put(`/diachikhachhang/${madiachi}`, {
      makhachhang: data.makhachhang,
      diachi: data.diachi,
      tennguoinhan: data.tennguoinhan,
      sodienthoai: data.sodienthoai
    });
    return response.data;
  },

  delete: async (madiachi) => {
    const response = await axios.delete(`/diachikhachhang/${madiachi}`);
    return response.data;
  }
};

export default diachikhachhangService;