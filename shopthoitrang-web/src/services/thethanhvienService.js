import api from './api';


const thethanhvienService = {
  getAll: async () => {
  const response = await api.get('/thethanhvien');
    return response.data;
  },

  getById: async (mathe) => {
  const response = await api.get(`/thethanhvien/${mathe}`);
    return response.data;
  },

  getByKhachHang: async (makhachhang) => {
  const response = await api.get(`/thethanhvien/khachhang/${makhachhang}`);
    return response.data;
  },

  create: async (data) => {
  const response = await api.post('/thethanhvien', {
      makhachhang: data.makhachhang,
      mahangthe: data.mahangthe,
      ngaycap: data.ngaycap,
      ngayhethan: data.ngayhethan,
      trangthai: data.trangthai
    });
    return response.data;
  },

  update: async (mathe, data) => {
  const response = await api.put(`/thethanhvien/${mathe}`, {
      makhachhang: data.makhachhang,
      mahangthe: data.mahangthe,
      ngaycap: data.ngaycap,
      ngayhethan: data.ngayhethan,
      trangthai: data.trangthai
    });
    return response.data;
  },

  delete: async (mathe) => {
  const response = await api.delete(`/thethanhvien/${mathe}`);
    return response.data;
  },

  // API để kiểm tra thẻ còn hiệu lực hay không
  checkValidity: async (mathe) => {
  const response = await api.get(`/thethanhvien/check-validity/${mathe}`);
    return response.data;
  },

  // API để lấy thông tin hạng thẻ của khách hàng
  getCustomerCardRank: async (makhachhang) => {
  const response = await api.get(`/thethanhvien/rank/${makhachhang}`);
    return response.data;
  }
};

export default thethanhvienService;