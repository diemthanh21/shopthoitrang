import { useEffect, useState } from 'react';
import thongbaoService from '../services/thongbaoService';

export default function ThongBaoPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await thongbaoService.getRecent({ limit: 200 });
        if (!mounted) return;
        setLogs(data || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[ThongBaoPage] load logs', e?.message || e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Thông báo hệ thống</h1>
      {loading && <div className="text-gray-600">Đang tải...</div>}
      {!loading && logs.length === 0 && (
        <p className="text-gray-600">Chưa có bản ghi hệ thống. Hãy thực hiện một số thao tác (đổi/trả) để kiểm tra.</p>
      )}

      {!loading && logs.length > 0 && (() => {
        const total = logs.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const current = Math.min(Math.max(1, page), totalPages);
        const start = (current - 1) * pageSize;
        const pageItems = logs.slice(start, start + pageSize);

        return (
          <div>
            <div className="space-y-2 mb-3">
              {pageItems.map((l, idx) => (
                <div key={start + idx} className="p-3 border rounded bg-white shadow-sm">
                  <div className="text-sm text-gray-500">{new Date(l.created_at).toLocaleString()}</div>
                  <div className="font-medium">{l.entity} #{l.entity_id} — {l.action}</div>
                  {l.note && <div className="text-gray-700">{l.note}</div>}
                  <div className="text-xs text-gray-500">Actor: {l.actor_type}{l.actor_id ? ` (${l.actor_id})` : ''}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">Hiển thị {start + 1}–{Math.min(start + pageItems.length, total)} trên {total} mục</div>
              <div className="space-x-2">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={current <= 1}
                >
                  Prev
                </button>
                <span className="px-2">{current}/{totalPages}</span>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={current >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
