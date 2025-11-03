import axios from '../configs/axios';

const danhmucService = {
  getAll: async () => {
    const response = await axios.get('/danhmucsanpham');
    return response.data;
  },

  getById: async (madanhmuc) => {
    const response = await axios.get(`/danhmucsanpham/${madanhmuc}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/danhmucsanpham', {
      tendanhmuc: data.tendanhmuc
    });
    return response.data;
  },

  update: async (madanhmuc, data) => {
    const response = await axios.put(`/danhmucsanpham/${madanhmuc}`, {
      tendanhmuc: data.tendanhmuc
    });
    return response.data;
  },

//   delete: async (madanhmuc) => {
//     const response = await axios.delete(`/danhmucsanpham/${madanhmuc}`);
//     return response.data;
//   }
};

export default danhmucService;
