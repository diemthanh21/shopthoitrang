import api from './api';

const khuyenmaiService = {
  // Get all promotions
  getAll: async () => {
    const response = await api.get('/khuyenmai');
    return response.data;
  },

  // Get promotion by ID
  getById: async (id) => {
    const response = await api.get(`/khuyenmai/${id}`);
    return response.data;
  },

  // Create new promotion
  create: async (data) => {
    const response = await api.post('/khuyenmai', data);
    return response.data;
  },

  // Update promotion
  update: async (id, data) => {
    const response = await api.put(`/khuyenmai/${id}`, data);
    return response.data;
  },

  // Delete promotion
  delete: async (id) => {
    const response = await api.delete(`/khuyenmai/${id}`);
    return response.data;
  },
};

export default khuyenmaiService;
