import api from './api';

const PREFIX = '/system-logs';

const getRecent = async (opts = {}) => {
  const params = { limit: opts.limit || 100 };
  if (opts.userId) {
    params.userId = opts.userId;
  }
  const res = await api.get(PREFIX, { params });
  return res.data || [];
};

/**
 * Get count of recent notifications (last 24 hours)
 */
const getRecentCount = async () => {
  try {
    const logs = await getRecent({ limit: 100 });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(log => new Date(log.created_at) > oneDayAgo);
    return recentLogs.length;
  } catch (error) {
    console.error('Error getting recent count:', error);
    return 0;
  }
};

/**
 * Đánh dấu thông báo đã đọc
 */
const markAsRead = async (manhanvien, entity, entity_id, action) => {
  try {
    const res = await api.post(`${PREFIX}/mark-read`, {
      manhanvien,
      entity,
      entity_id,
      action
    });
    return res.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export default { getRecent, getRecentCount, markAsRead };
