import api from './api';

const PREFIX = '/system-logs';

const getRecent = async (opts = {}) => {
  const res = await api.get(PREFIX, { params: { limit: opts.limit || 100 } });
  return res.data || [];
};

export default { getRecent };
