import { useEffect, useMemo, useState } from 'react';
import chatService from '../services/chatService';

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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!chatbox) return;
      try {
        const data = await chatService.getMessages(chatbox.machatbox);
        if (mounted) {
          // filter out system notifications so they are not shown in the conversation
          setMessages((data || []).filter(m => !isSystemMessage(m)));
        }
      } catch (e) { console.error(e); }
    };
    load();
    return () => { mounted = false; };
  }, [chatbox]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      const msg = await chatService.sendMessage(chatbox.machatbox, text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
      onSend && onSend(chatbox.machatbox, msg);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Gửi tin nhắn thất bại';
      alert(msg);
    } finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1" onClick={onClose} />
      <div className="w-full max-w-md h-full bg-white shadow-xl border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Trao đổi với {chatbox?.khachHang?.hoten || `KH#${chatbox?.makhachhang}`}</h3>
          <p className="text-xs text-gray-500">Chatbox #{chatbox?.machatbox}</p>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-3 bg-gray-50">
          {messages.map(m => {
            const isAdmin = m.nguoigui === 'NV';
            const prod = parseProductFromContent(m.noidung);
            return (
              <div key={m.machat} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow ${isAdmin ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'}`}>
                  {!isAdmin && m.nhanvien && (
                    <div className="text-[10px] opacity-80 mb-0.5">{m.nhanvien.tendangnhap}</div>
                  )}
                  {prod.isProduct ? (
                    <ProductBubble data={prod.product} right={isAdmin} />
                  ) : (
                    <div>{m.noidung}</div>
                  )}
                  <div className={`text-[10px] mt-1 flex items-center gap-2 ${isAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span>{formatTime(m.thoigiangui)}</span>
                    {m.daxem ? <span className="text-[10px] italic opacity-70">✓</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >Gửi</button>
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
      const data = await chatService.listChatBoxes();
      setList(data);
      setPage(1);
      // reset last messages cache and populate with available lastMessage
      const map = {};
      (data || []).forEach(b => {
        if (b.lastMessage && !isSystemMessage(b.lastMessage)) map[b.machatbox] = b.lastMessage;
      });
      setLastMessagesByBox(map);

      // Only fetch full message lists (to find last non-system message) when explicitly requested
      if (fetchMessages) {
        const jobs = (data || []).map(async b => {
          try {
            // already have a non-system lastMessage from list; skip
            if (map[b.machatbox]) return;
            const msgs = await chatService.getMessages(b.machatbox);
            if (Array.isArray(msgs) && msgs.length) {
              for (let i = msgs.length - 1; i >= 0; i--) {
                const m = msgs[i];
                if (!isSystemMessage(m)) { map[b.machatbox] = m; break; }
              }
            }
          } catch (_) {}
        });
        await Promise.allSettled(jobs);
        setLastMessagesByBox({ ...map });
      }
    } catch (e) {
      console.error(e);
      alert('Không tải được danh sách hội thoại');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openChat = (box) => { setSelected(box); setDrawerOpen(true); };
  const closeChat = () => { setDrawerOpen(false); setSelected(null); };

  const filteredList = useMemo(() => {
    const s = (searchText || '').trim().toLowerCase();
    return (list || []).filter(b => {
      // search by customer name or id
      const name = (b.khachHang?.hoten || `KH#${b.makhachhang}` || '').toString().toLowerCase();
      if (s && !name.includes(s)) return false;
      if (statusFilter === 'unread') return (b.unreadFromCustomer || 0) > 0;
      if (statusFilter === 'read') return (b.unreadFromCustomer || 0) === 0;
      return true;
    });
  }, [list, searchText, statusFilter]);

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Tin nhắn</h1>
        <button onClick={() => load(true)} className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200">Làm mới</button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Tìm theo tên khách hàng..."
          className="px-3 py-2 border rounded w-64 text-sm focus:outline-none"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-2 border rounded text-sm">
          <option value="all">Tất cả</option>
          <option value="unread">Chưa đọc</option>
          <option value="read">Đã đọc</option>
        </select>
        <div className="ml-auto text-sm text-gray-600">Tổng số tin nhắn: {(filteredList || []).length}</div>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Khách hàng</th>
                <th className="px-3 py-2 text-left">Tin mới nhất</th>
                <th className="px-3 py-2 text-left">Chưa đọc</th>
                <th className="px-3 py-2 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((b) => {
                const last = lastMessagesByBox[b.machatbox] || (b.lastMessage && !isSystemMessage(b.lastMessage) ? b.lastMessage : null);
                const lp = last ? parseProductFromContent(last.noidung) : { isProduct: false };
                const fromKH = last && !isSystemMessage(last) && (last.nguoigui !== 'NV');
                const hasUnread = (b.unreadFromCustomer || 0) > 0;
                const highlight = fromKH && hasUnread;
                return (
                  <tr key={b.machatbox} className="border-t">
                    <td className="px-3 py-2">{b.khachHang?.hoten || `KH#${b.makhachhang}`}</td>
                    <td className={`px-3 py-2 ${highlight ? 'bg-yellow-50 font-medium text-gray-800' : 'text-gray-600'}`}>
                      {last && !isSystemMessage(last) ? (
                        (() => {
                          const tag = last.nguoigui === 'NV' ? 'NV' : 'KH';
                          return `${tag}: ${lp.isProduct ? '[Thẻ sản phẩm]' : last.noidung}`;
                        })()
                      ) : ''}
                    </td>
                    <td className="px-3 py-2">{b.unreadFromCustomer || 0}</td>
                    <td className="px-3 py-2">
                      <button className="px-2 py-1 text-sm rounded bg-blue-600 text-white" onClick={() => openChat(b)}>Mở</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t bg-white">
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border bg-gray-50 disabled:opacity-50"
            >Prev</button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border bg-gray-50 disabled:opacity-50"
            >Next</button>
            <div className="text-sm text-gray-600">Trang {page} / {totalPages}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">Hiển thị</div>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded text-sm">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
        </>
      )}

      <ChatDrawer open={drawerOpen} onClose={closeChat} chatbox={selected} onSend={() => {}} />
    </div>
  );
}
