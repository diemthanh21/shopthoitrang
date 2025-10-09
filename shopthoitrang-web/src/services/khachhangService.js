import axios from '../configs/axios';

const khachhangService = {
  getAll: async (params = {}) => {
    const response = await axios.get('/taikhoankhachhang', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/taikhoankhachhang/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/taikhoankhachhang', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/taikhoankhachhang/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/taikhoankhachhang/${id}`);
    return response.data;
  }
};

export default khachhangService;
