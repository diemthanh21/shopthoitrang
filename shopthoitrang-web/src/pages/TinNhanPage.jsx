import { useEffect, useMemo, useState } from 'react';
import chatService from '../services/chatService';
import { supabase } from '../utils/supabaseClient';

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString('vi-VN');
  } catch { return ts; }
}

const isProductJson = (s) => {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim();
  return t.startsWith('{') && t.includes('"type"') && t.includes('"product"');
};

const parseProductFromContent = (content) => {
  try {
    if (!isProductJson(content)) return { isProduct: false };
    const obj = JSON.parse(content);
    if (obj && obj.type === 'product' && obj.product && typeof obj.product === 'object') {
      return { isProduct: true, product: obj.product };
    }
  } catch (_) {}
  return { isProduct: false };
};

const ProductBubble = ({ data, right }) => {
  const p = data || {};
  const price = p.giaban;
  return (
    <div className={`w-[280px] rounded-lg border ${right ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'} p-2`}>      
      <div className="flex gap-2">
        <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 flex-shrink-0">
          {p.hinhanh ? (
            <img src={p.hinhanh} alt={p.tensanpham || 'product'} className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0">
          <div className={`text-[13px] font-semibold ${right ? 'text-blue-900' : 'text-gray-900'} line-clamp-2`}>{p.tensanpham || 'Sản phẩm'}</div>
          {price != null && (
            <div className={`text-[12px] mt-1 ${right ? 'text-blue-700' : 'text-red-600'} font-semibold`}>{Number(price).toFixed(0)}đ</div>
          )}
          {(p.mausac || p.kichco) && (
            <div className="text-[11px] text-gray-500 mt-0.5">
              {[p.mausac && `Màu: ${p.mausac}`, p.kichco && `Size: ${p.kichco}`].filter(Boolean).join(' • ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// detect if a message is a system notification that should be hidden
const isSystemMessage = (m) => {
  if (!m) return false;
  try {
    const text = (m.noidung || '').toString();
    if (text.startsWith('[SYSTEM]')) return true;
    if (m.nhanvien && m.nhanvien.tendangnhap && m.nhanvien.tendangnhap.toUpperCase() === 'SYSTEM') return true;
    if (m.nguoigui && m.nguoigui.toUpperCase() === 'SYSTEM') return true;
  } catch (_) {}
  return false;
};

const ChatDrawer = ({ open, onClose, chatbox, onSend }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // chatbox can be either the customer item (with .chatbox property) or the chatbox directly
      const box = chatbox?.chatbox || chatbox;
      if (!box || !box.machatbox) return;
      try {
        const data = await chatService.getMessages(box.machatbox);
        if (mounted) {
          // filter out system notifications so they are not shown in the conversation
          setMessages((data || []).filter(m => !isSystemMessage(m)));
        }
      } catch (e) { console.error(e); }
    };
    load();
    return () => { mounted = false; };
  }, [chatbox]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Kích thước video không được vượt quá 50MB');
        return;
      }
      setSelectedVideo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const clearVideo = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
  };

  const handleSend = async () => {
    if (!text.trim() && !selectedImage && !selectedVideo) return;
    try {
      setLoading(true);
      setUploadProgress(0);
      
      let imageUrl = null;
      let videoUrl = null;
      
      if (selectedImage) {
        // Upload image to Supabase Storage
        try {
          const fileExt = selectedImage.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = fileName;
          const bucketName = 'anhchat';
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, selectedImage, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          imageUrl = publicUrl;
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert('Không thể tải ảnh lên. Vui lòng thử lại.');
          setLoading(false);
          return;
        }
      }

      if (selectedVideo) {
        // Upload video to Supabase Storage
        try {
          setUploadProgress(10);
          const fileExt = selectedVideo.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = fileName;
          const bucketName = 'videochat';
          
          setUploadProgress(30);
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, selectedVideo, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Supabase video upload error:', uploadError);
            throw uploadError;
          }

          setUploadProgress(80);
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          videoUrl = publicUrl;
          setUploadProgress(100);
        } catch (uploadError) {
          console.error('Video upload failed:', uploadError);
          alert('Không thể tải video lên. Vui lòng thử lại.');
          setLoading(false);
          setUploadProgress(0);
          return;
        }
      }
      
      const box = chatbox?.chatbox || chatbox;
      const msg = await chatService.sendMessage(box.machatbox, text.trim() || '', imageUrl, videoUrl);
      setMessages(prev => [...prev, msg]);
      setText('');
      clearImage();
      clearVideo();
      setUploadProgress(0);
      
      // Mark all messages in this chatbox as read when employee replies
      try {
        await chatService.markAllRead(box.machatbox);
      } catch (markReadError) {
        console.error('Failed to mark messages as read:', markReadError);
      }
      
      onSend && onSend(box.machatbox, msg);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Gửi tin nhắn thất bại';
      alert(msg);
    } finally { setLoading(false); setUploadProgress(0); }
  };

  if (!open) return null;
  const box = chatbox?.chatbox || chatbox;
  const customerName = chatbox?.hoten || box?.khachHang?.hoten || `KH#${chatbox?.makhachhang || box?.makhachhang}`;
  const chatboxId = box?.machatbox;
  
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-slideIn">
        <div className="p-4 border-b flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Trao đổi với {customerName}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">{chatboxId ? `Chatbox #${chatboxId}` : 'Hội thoại mới'}</p>
          </div>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100 text-gray-500 text-xs">Đóng</button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 && (
            <div className="text-xs text-gray-500 text-center mt-6">Chưa có tin nhắn nào</div>
          )}
          {messages.map(m => {
            const isAdmin = m.nguoigui === 'NV';
            const prod = parseProductFromContent(m.noidung);
            const hasImage = m.anhchat && m.anhchat.trim();
            const hasVideo = m.videochat && m.videochat.trim();
            return (
              <div key={m.machat} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`group max-w-[80%] rounded-xl px-3 py-2 text-sm shadow-sm ring-1 ring-gray-200/60 ${isAdmin ? 'bg-blue-600 text-white ring-blue-500/50' : 'bg-white text-gray-800'} transition`}>                  
                  {!isAdmin && m.nhanvien && (
                    <div className="text-[10px] opacity-70 mb-0.5">{m.nhanvien.tendangnhap}</div>
                  )}
                  {hasImage && (
                    <div className="mb-2">
                      <img src={m.anhchat} alt="Chat image" className="max-w-full rounded-lg max-h-64 object-cover" />
                    </div>
                  )}
                  {hasVideo && (
                    <div className="mb-2">
                      <video controls className="max-w-full rounded-lg max-h-64" preload="metadata">
                        <source src={m.videochat} type="video/mp4" />
                        <source src={m.videochat} type="video/webm" />
                        <source src={m.videochat} type="video/ogg" />
                        Trình duyệt của bạn không hỗ trợ xem video.
                      </video>
                    </div>
                  )}
                  {prod.isProduct ? (
                    <ProductBubble data={prod.product} right={isAdmin} />
                  ) : m.noidung ? (
                    <div className="leading-relaxed whitespace-pre-wrap break-words">{m.noidung}</div>
                  ) : (hasImage || hasVideo) ? (
                    <div className={`text-xs italic ${isAdmin ? 'text-blue-200' : 'text-gray-500'}`}>
                      {hasImage && '[Ảnh]'}
                      {hasVideo && '[Video]'}
                    </div>
                  ) : null}
                  <div className={`text-[10px] mt-1 flex items-center gap-2 ${isAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span>{formatTime(m.thoigiangui)}</span>
                    {m.daxem ? <span className="text-[10px] italic opacity-70">✓</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t bg-white">
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-2">
              <div className="text-xs text-gray-600 mb-1">Đang tải lên... {uploadProgress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-24 rounded-lg border" />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >×</button>
            </div>
          )}
          {videoPreview && (
            <div className="mb-2 relative inline-block">
              <video src={videoPreview} className="max-h-24 rounded-lg border" />
              <button
                onClick={clearVideo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >×</button>
            </div>
          )}
          <div className="flex gap-2">
            <label className="cursor-pointer px-3 py-2 border rounded-lg hover:bg-gray-50 transition" title="Chọn ảnh">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={loading || !!selectedVideo}
              />
              <span className="text-sm">📷</span>
            </label>
            <label className="cursor-pointer px-3 py-2 border rounded-lg hover:bg-gray-50 transition" title="Chọn video">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
                disabled={loading || !!selectedImage}
              />
              <span className="text-sm">🎥</span>
            </label>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/60"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || (!text.trim() && !selectedImage && !selectedVideo)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60 shadow hover:bg-blue-500 active:scale-[.97] transition"
            >{loading ? 'Đang gửi...' : 'Gửi'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TinNhanPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | unread | read
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [lastMessagesByBox, setLastMessagesByBox] = useState({});

  const load = async (fetchMessages = false) => {
    try {
      setLoading(true);
      const data = await chatService.listAllCustomersWithChats();
      setList(data);
      setPage(1);
      // reset last messages cache and populate with available lastMessage
      const map = {};
      (data || []).forEach(item => {
        if (item.chatbox && item.chatbox.lastMessage && !isSystemMessage(item.chatbox.lastMessage)) {
          map[item.chatbox.machatbox] = item.chatbox.lastMessage;
        }
      });
      setLastMessagesByBox(map);

      // Only fetch full message lists (to find last non-system message) when explicitly requested
      if (fetchMessages) {
        const jobs = (data || []).filter(item => item.chatbox).map(async item => {
          try {
            // already have a non-system lastMessage from list; skip
            if (map[item.chatbox.machatbox]) return;
            const msgs = await chatService.getMessages(item.chatbox.machatbox);
            if (Array.isArray(msgs) && msgs.length) {
              for (let i = msgs.length - 1; i >= 0; i--) {
                const m = msgs[i];
                if (!isSystemMessage(m)) { map[item.chatbox.machatbox] = m; break; }
              }
            }
          } catch (_) {}
        });
        await Promise.allSettled(jobs);
        setLastMessagesByBox({ ...map });
      }
    } catch (e) {
      console.error(e);
      alert('Không tải được danh sách khách hàng');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openChat = async (item) => {
    try {
      // If customer has no chatbox, create one first
      if (!item.chatbox) {
        const newChatbox = await chatService.startChatForCustomer(item.makhachhang);
        // Create a temporary item with the new chatbox
        const itemWithChatbox = {
          ...item,
          chatbox: {
            ...newChatbox,
            khachHang: { hoten: item.hoten, makhachhang: item.makhachhang },
            nhanVien: null,
            lastMessage: null,
            unreadFromCustomer: 0
          }
        };
        setSelected(itemWithChatbox);
        setDrawerOpen(true);
        // Reload to get the updated list
        await load();
      } else {
        setSelected(item);
        setDrawerOpen(true);
      }
    } catch (err) {
      console.error('Error opening chat:', err);
      alert('Không thể mở hội thoại');
    }
  };
  const closeChat = () => { setDrawerOpen(false); setSelected(null); };
  
  // Callback to reload data after sending a message
  const handleMessageSent = async () => {
    await load(); // Reload the chatbox list to update unread counts
  };

  const filteredList = useMemo(() => {
    const s = (searchText || '').trim().toLowerCase();
    return (list || [])
      .filter(item => {
        // Only show customers without chatbox when searching
        if (!item.chatbox && !s) return false;

        // search by customer name or id
        const name = (item.hoten || `KH#${item.makhachhang}` || '').toString().toLowerCase();
        if (s && !name.includes(s)) return false;

        // For status filter, only apply if customer has a chatbox
        if (item.chatbox) {
          if (statusFilter === 'unread') return (item.chatbox.unreadFromCustomer || 0) > 0;
          if (statusFilter === 'read') return (item.chatbox.unreadFromCustomer || 0) === 0;
        } else {
          // Customers without chatboxes are only shown when searching
          if (statusFilter !== 'all') return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Priority 1: Customers with unread messages
        const aUnread = a.chatbox && (a.chatbox.unreadFromCustomer || 0) > 0;
        const bUnread = b.chatbox && (b.chatbox.unreadFromCustomer || 0) > 0;
        if (aUnread && !bUnread) return -1;
        if (!aUnread && bUnread) return 1;

        // Priority 2: Customers with chatboxes (but no unread)
        const aHasBox = !!a.chatbox;
        const bHasBox = !!b.chatbox;
        if (aHasBox && !bHasBox) return -1;
        if (!aHasBox && bHasBox) return 1;

        // Priority 3: Sort by last message time (for customers with chatboxes)
        if (aHasBox && bHasBox) {
          const aLastMsg = lastMessagesByBox[a.chatbox.machatbox] || (a.chatbox.lastMessage && !isSystemMessage(a.chatbox.lastMessage) ? a.chatbox.lastMessage : null);
          const bLastMsg = lastMessagesByBox[b.chatbox.machatbox] || (b.chatbox.lastMessage && !isSystemMessage(b.chatbox.lastMessage) ? b.chatbox.lastMessage : null);
          const aTime = aLastMsg?.thoigiangui ? new Date(aLastMsg.thoigiangui).getTime() : 0;
          const bTime = bLastMsg?.thoigiangui ? new Date(bLastMsg.thoigiangui).getTime() : 0;
          if (aTime !== bTime) return bTime - aTime;
        }

        // Priority 4: Sort by customer ID (newest first)
        return b.makhachhang - a.makhachhang;
      });
  }, [list, searchText, statusFilter, lastMessagesByBox]);

  const totalPages = Math.max(1, Math.ceil((filteredList || []).length / pageSize));

  // keep page in range when filteredList or pageSize changes
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (filteredList || []).slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  return (
    <div className="space-y-5">
      {/* Removed title & refresh button per user request */}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Tìm theo tên khách hàng..."
            className="pl-9 pr-3 py-2 border rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white shadow-sm focus:outline-none">
          <option value="all">Tất cả</option>
          <option value="unread">Chưa đọc</option>
          <option value="read">Đã đọc</option>
        </select>
        {/* Removed conversation count per user request */}
      </div>

      {loading ? (
        <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500 shadow-sm animate-pulse">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700 text-[13px]">
                <tr className="divide-x divide-gray-200/60">
                  <th className="px-4 py-2 text-left font-medium">Khách hàng</th>
                  <th className="px-4 py-2 text-left font-medium">Tin mới nhất</th>
                  <th className="px-4 py-2 text-left font-medium w-24">Chưa đọc</th>
                  <th className="px-4 py-2 text-left font-medium w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">Không có khách hàng nào phù hợp</td>
                  </tr>
                )}
                {paginatedList.map((item) => {
                  const box = item.chatbox;
                  const last = box ? (lastMessagesByBox[box.machatbox] || (box.lastMessage && !isSystemMessage(box.lastMessage) ? box.lastMessage : null)) : null;
                  const lp = last ? parseProductFromContent(last.noidung) : { isProduct: false };
                  const fromKH = last && !isSystemMessage(last) && (last.nguoigui !== 'NV');
                  const hasUnread = box && (box.unreadFromCustomer || 0) > 0;
                  const highlight = fromKH && hasUnread;
                  return (
                    <tr
                      key={item.makhachhang}
                      onClick={() => openChat(item)}
                      className={`cursor-pointer group hover:bg-blue-50/40 transition ${highlight ? 'bg-yellow-50/60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-semibold shadow-sm">{(item.hoten || 'KH').charAt(0).toUpperCase()}</div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 truncate">{item.hoten || `KH#${item.makhachhang}`}</div>
                            
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`truncate text-[13px] ${highlight ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                            {last && !isSystemMessage(last) ? (() => {
                              const tag = last.nguoigui === 'NV' ? 'NV' : 'KH';
                              let content = '';
                              if (lp.isProduct) {
                                content = '[Thẻ sản phẩm]';
                              } else if (last.videochat && last.videochat.trim()) {
                                content = '[Video]';
                              } else if (last.anhchat && last.anhchat.trim()) {
                                content = '[Ảnh]';
                              } else {
                                content = last.noidung || '';
                              }
                              return `${tag}: ${content}`;
                            })() : (box ? '—' : 'Bắt đầu trò chuyện')}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {hasUnread ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-500/20">{box.unreadFromCustomer}</span>
                        ) : (
                          <span className="text-xs text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openChat(item); }}
                          className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-500 active:scale-[.96] transition"
                        >{box ? 'Mở' : 'Bắt đầu'}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-1 bg-white border rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              Trang <span className="font-medium text-gray-800">{page}</span> / <span className="font-medium text-gray-800">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded border text-sm bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >Trước</button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm transition ${
                      page === pageNum
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >{pageNum}</button>
                );
              })}
              
              {totalPages > 5 && page < totalPages - 2 && (
                <>
                  <span className="px-2 text-gray-400">...</span>
                  <button
                    onClick={() => setPage(totalPages)}
                    className="w-8 h-8 rounded border text-sm bg-white hover:bg-gray-50 transition"
                  >{totalPages}</button>
                </>
              )}
              
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded border text-sm bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition ml-1"
              >Tiếp</button>
            </div>
          </div>
        </>
      )}
      <ChatDrawer open={drawerOpen} onClose={closeChat} chatbox={selected} onSend={handleMessageSent} />
    </div>
  );
}
