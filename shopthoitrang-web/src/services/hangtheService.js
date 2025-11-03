import axios from '../configs/axios';

const hangtheService = {
  getAll: async () => {
    const response = await axios.get('/hangthe');
    return response.data;
  },

  getById: async (mahangthe) => {
    const response = await axios.get(`/hangthe/${mahangthe}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/hangthe', {
      tenhang: data.tenhang,
      dieukien_nam: data.dieukien_nam,
      dieukien_tichluy: data.dieukien_tichluy,
      giamgia: data.giamgia,
      voucher_sinhnhat: data.voucher_sinhnhat,
      uudai: data.uudai
    });
    return response.data;
  },

  update: async (mahangthe, data) => {
    const response = await axios.put(`/hangthe/${mahangthe}`, {
      tenhang: data.tenhang,
      dieukien_nam: data.dieukien_nam,
      dieukien_tichluy: data.dieukien_tichluy,
      giamgia: data.giamgia,
      voucher_sinhnhat: data.voucher_sinhnhat,
      uudai: data.uudai
    });
    return response.data;
  },

  delete: async (mahangthe) => {
    const response = await axios.delete(`/hangthe/${mahangthe}`);
    return response.data;
  }
};

export default hangtheService;
