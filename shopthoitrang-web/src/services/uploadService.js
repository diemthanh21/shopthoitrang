import api from './api';

/**
 * Upload file ảnh/video cho đơn trả hàng
 * @param {File} file - File object from input
 * @param {number} orderId - Mã đơn hàng
 * @returns {Promise<{url: string, path: string}>} - Public URL và path của file
 */
const uploadReturnMedia = async (file, orderId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('orderId', orderId);

  const res = await api.post('/uploads/return-media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return {
    url: res.data.url,
    path: res.data.path,
  };
};

export default {
  uploadReturnMedia,
};
