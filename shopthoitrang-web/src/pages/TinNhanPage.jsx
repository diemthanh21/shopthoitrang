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
        if (mounted) setMessages(data);
        // Bulk mark read when opening
        try {
          await chatService.markAllRead(chatbox.machatbox);
          if (mounted) {
            setMessages(prev => prev.map(m => ({ ...m, daxem: true })));
          }
        } catch (e) {
          console.warn('markAllRead failed', e);
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

  const load = async () => {
    try {
      setLoading(true);
      const data = await chatService.listChatBoxes();
      setList(data);
    } catch (e) {
      console.error(e);
      alert('Không tải được danh sách hội thoại');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openChat = (box) => { setSelected(box); setDrawerOpen(true); };
  const closeChat = () => { setDrawerOpen(false); setSelected(null); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Tin nhắn</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200">Làm mới</button>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : (
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
              {list.map((b) => (
                <tr key={b.machatbox} className="border-t">
                  <td className="px-3 py-2">{b.khachHang?.hoten || `KH#${b.makhachhang}`}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {b.lastMessage ? (
                      (() => {
                        const tag = b.lastMessage.nguoigui === 'NV' ? 'NV' : 'KH';
                        const lp = parseProductFromContent(b.lastMessage.noidung);
                        return `${tag}: ${lp.isProduct ? '[Thẻ sản phẩm]' : b.lastMessage.noidung}`;
                      })()
                    ) : ''}
                  </td>
                  <td className="px-3 py-2">{b.unreadFromCustomer || 0}</td>
                  <td className="px-3 py-2">
                    <button className="px-2 py-1 text-sm rounded bg-blue-600 text-white" onClick={() => openChat(b)}>Mở</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ChatDrawer open={drawerOpen} onClose={closeChat} chatbox={selected} onSend={() => {}} />
    </div>
  );
}
