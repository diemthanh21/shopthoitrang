import api from './api';

const ratingService = {
  /**
   * Get all ratings with optional filters
   * @param {Object} params - Query params { masanpham, makhachhang, diemdanhgia }
   */
  async list(params = {}) {
    const { data } = await api.get('/danhgia', { params });
    return data;
  },

  /**
   * Get rating by ID
   * @param {number} id - Rating ID
   */
  async getById(id) {
    const { data } = await api.get(`/danhgia/${id}`);
    return data;
  },

  /**
   * Update rating (admin reply)
   * @param {number} id - Rating ID
   * @param {Object} payload - { phanhoitushop }
   */
  async reply(id, phanhoitushop) {
    const { data } = await api.put(`/danhgia/${id}`, { phanhoitushop });
    return data;
  },

  /**
   * Mark rating as read by admin
   * @param {number} id - Rating ID
   */
  async markRead(id) {
    const { data } = await api.patch(`/danhgia/${id}/mark-read`);
    return data;
  },

  /**
   * Get unread count (ratings without admin response)
   */
  async getUnreadCount() {
    const all = await this.list();
    return all.filter(r => !r.phanhoitushop).length;
  }
};

export default ratingService;
