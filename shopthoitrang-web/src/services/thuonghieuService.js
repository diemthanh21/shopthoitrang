import axios from '../configs/axios';

const thuonghieuService = {
  getAll: async () => {
    const response = await axios.get('/thuonghieu');
    return response.data;
  },

  getById: async (mathuonghieu) => {
    const response = await axios.get(`/thuonghieu/${mathuonghieu}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/thuonghieu', {
      tenthuonghieu: data.tenthuonghieu
    });
    return response.data;
  },

  update: async (mathuonghieu, data) => {
    const response = await axios.put(`/thuonghieu/${mathuonghieu}`, {
      tenthuonghieu: data.tenthuonghieu
    });
    return response.data;
  },

//   delete: async (mathuonghieu) => {
//     const response = await axios.delete(`/thuonghieusanpham/${mathuonghieu}`);
//     return response.data;
//   }
};

export default thuonghieuService;
