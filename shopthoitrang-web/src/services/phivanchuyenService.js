import api from './api';

const RESOURCE = '/phivanchuyen';

const phiVanChuyenService = {
  async getConfig() {
    const response = await api.get(RESOURCE);
    return response.data;
  },

  async updateConfig(payload) {
    const response = await api.put(RESOURCE, payload);
    return response.data;
  },

  async estimateFee(province) {
    const response = await api.get(`${RESOURCE}/estimate`, {
      params: { tinh: province },
    });
    return response.data;
  },
};

export default phiVanChuyenService;
