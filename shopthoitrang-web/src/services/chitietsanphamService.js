import axios from '../configs/axios';

const chitietsanphamService = {
  getAll: async () => {
    const response = await axios.get('/chitietsanpham');
    return response.data;
  },

  getByProductId: async (masanpham) => {
    const response = await axios.get(`/chitietsanpham/${masanpham}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/chitietsanpham', data);
    return response.data;
  },

  update: async (machitietsanpham, data) => {
    const response = await axios.put(`/chitietsanpham/${machitietsanpham}`, data);
    return response.data;
  }
};

export default chitietsanphamService;
