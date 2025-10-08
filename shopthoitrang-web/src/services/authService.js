import api from './api';

function extractAuthPayload(res) {
  const payload = res?.data || {};
  const token = payload?.data?.token;
  const user = payload?.data?.user;
  if (!token || !user) {
    throw new Error(payload?.message || 'Phản hồi đăng nhập không hợp lệ');
  }
  return { token, user };
}

const authService = {
  async login(username, password) {
    try {
      const res = await api.post('/auth/login/employee', {
        tendangnhap: username,
        matkhau: password
      });
      const { token, user } = extractAuthPayload(res);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    } catch (err) {
      if (err.response) {
        // Backend có phản hồi
        const msg =
          err.response.data?.message ||
          (err.response.status === 401
            ? 'Sai thông tin đăng nhập'
            : `Lỗi ${err.response.status}`);
        throw new Error(msg);
      }
      throw new Error('Không thể kết nối máy chủ');
    }
  },

  // Alias nếu code cũ dùng loginEmployee
  loginEmployee(username, password) {
    return this.login(username, password);
  },

  async changePassword(oldPassword, newPassword) {
    const res = await api.put('/auth/change-password', {
      matkhaucu: oldPassword,
      matkhaumoi: newPassword
    });
    return res.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('token');
  }
};

export default authService;