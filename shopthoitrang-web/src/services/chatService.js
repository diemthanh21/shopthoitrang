import api from './api';

const chatService = {
  // Admin list all customers with chatbox data (if exists)
  async listAllCustomersWithChats() {
    const res = await api.get('/chat/admin/all-customers');
    return res.data;
  },
  // Admin list chat boxes with metadata
  async listChatBoxes() {
    const res = await api.get('/chat/admin/boxes');
    return res.data;
  },
  // Customer start or get chat box
  async startChat() {
    const res = await api.post('/chat/start');
    return res.data;
  },
  // Admin/Staff: create or get chatbox for a specific customer
  async startChatForCustomer(makhachhang) {
    const res = await api.post('/chat/admin/start-for-customer', { makhachhang });
    return res.data;
  },
  // Get messages of a chat box
  async getMessages(machatbox) {
    const res = await api.get(`/chat/messages/${machatbox}`);
    return res.data;
  },
  // Send message (auto detect role server-side)
  async sendMessage(machatbox, noidung, anhchat = null, videochat = null) {
    const res = await api.post('/chat/send', { machatbox, noidung, anhchat, videochat });
    return res.data;
  },
  async markRead(id) {
    const res = await api.put(`/chat/read/${id}`);
    return res.data;
  }
  ,
  async markAllRead(machatbox) {
    const res = await api.put(`/chat/read-all/${machatbox}`);
    return res.data;
  }
};

export default chatService;
