import api from './api';

const khachhangService = {
  getAll: async (params = {}) => {
  const response = await api.get('/taikhoankhachhang', { params });
    return response.data;
  },

  getById: async (id) => {
  const response = await api.get(`/taikhoankhachhang/${id}`);
    return response.data;
  },

  create: async (data) => {
  const response = await api.post('/taikhoankhachhang', data);
    return response.data;
  },

  update: async (id, data) => {
  const response = await api.put(`/taikhoankhachhang/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
  const response = await api.delete(`/taikhoankhachhang/${id}`);
    return response.data;
  }
};

export default khachhangService;
