import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Plus, Search, Edit, Trash2 } from "lucide-react";
import phancongService from "../services/phancongcaService";

// ====== utils ======
const startOfMonthStr = (ym) => `${ym}-01`; // ym = 'YYYY-MM'
const endOfMonthStr = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 0); // ngày cuối tháng
  return d.toISOString().slice(0, 10);
};
const addMonths = (ym, delta) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const viMonthTitle = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
};
const daysGrid = (ym) => {
  // tạo 6x7 ô
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const startOffset = (first.getDay() + 6) % 7; // về thứ 2
  const start = new Date(y, m - 1, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return {
      date: d,
      key: d.toISOString().slice(0, 10),
      inMonth: d.getMonth() === m - 1,
    };
  });
};

function StatusBadge({ value }) {
  const cls =
    value === "Đã phân công"
      ? "bg-blue-100 text-blue-700"
      : value === "Đã hoàn thành"
      ? "bg-green-100 text-green-700"
      : value === "Vắng mặt"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";
  return <span className={`px-2 py-0.5 text-xs rounded-full ${cls}`}>{value || "—"}</span>;
}

export default function PhanCongCaPage() {
  // 1) Chọn tháng–năm bằng input month
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [stFilter, setStFilter] = useState("");

  const from = useMemo(() => startOfMonthStr(ym), [ym]);
  const to   = useMemo(() => endOfMonthStr(ym),   [ym]);

  const grid = useMemo(() => daysGrid(ym), [ym]);

  // 2) Cache theo key 'from|to' để không gọi lại khi quay về tháng đã tải
  const cacheRef = useRef(new Map());
  // 3) AbortController để hủy request cũ (tránh double-call do StrictMode)
  const abortRef = useRef(null);

  useEffect(() => {
    const key = `${from}|${to}`;

    // cache hit
    if (cacheRef.current.has(key)) {
      setRows(cacheRef.current.get(key));
      setErr("");
      return;
    }

    // hủy request cũ nếu còn
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        const data = await phancongService.getByDateRange(from, to, controller.signal);
        cacheRef.current.set(key, data);
        setRows(data);
        setErr("");
      } catch (e) {
        if (e.name === "CanceledError" || e.name === "AbortError") return;
        console.error(e);
        setRows([]);
        setErr("Không thể tải danh sách ca làm việc");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [from, to]);

  // Lọc theo search + trạng thái
  const byDay = useMemo(() => {
    const idx = {};
    const term = search.trim().toLowerCase();
    for (const it of rows) {
      if (stFilter && it.trangThai !== stFilter) continue;
      if (term) {
        const hay = [
          it.maPhanCong, it.maNhanVien, it.maCa, it.ngayLamViec,
          it.trangThai, it.ghiChu, it.nguoiPhanCong
        ].map(v => String(v ?? "")).join(" ").toLowerCase();
        if (!hay.includes(term)) continue;
      }
      (idx[it.ngayLamViec] ??= []).push(it);
    }
    return idx;
  }, [rows, search, stFilter]);

  const goto = (delta) => setYm((cur) => addMonths(cur, delta));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý ca làm việc</h1>
            <p className="text-gray-600">Quản lý lịch làm việc của nhân viên</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* chọn tháng–năm */}
          <input
            type="month"
            value={ym}
            onChange={(e) => setYm(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <button onClick={() => goto(-1)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">←</button>
          <div className="min-w-40 text-center font-semibold">{viMonthTitle(ym)}</div>
          <button onClick={() => goto(1)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">→</button>
          <button className="ml-2 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={18} /> Thêm ca làm việc
          </button>
        </div>
      </div>

      {/* Filter/Search */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{err}</div>}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã phân công, NV, ca, ghi chú, trạng thái…"
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={stFilter}
            onChange={(e) => setStFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Tất cả trạng thái</option>
            <option>Đã phân công</option>
            <option>Đã hoàn thành</option>
            <option>Vắng mặt</option>
          </select>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="grid grid-cols-7 gap-3 text-sm font-semibold text-gray-600 px-1">
          {["T2","T3","T4","T5","T6","T7","CN"].map((d) => <div key={d} className="text-center">{d}</div>)}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-3">
          {grid.map(({ key, date, inMonth }) => {
            const list = byDay[key] ?? [];
            return (
              <div key={key}
                className={`min-h-[120px] rounded-xl border p-2 flex flex-col gap-1 ${
                  inMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                }`}
              >
                <div className="text-sm font-medium">{date.getDate()}</div>

                {list.length ? (
                  <div className="mt-1 flex-1 space-y-1 overflow-y-auto pr-1">
                    {list.map((it) => (
                      <div key={it.maPhanCong} className="border rounded-lg p-2 bg-gray-50">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div><span className="text-gray-500">Ca:</span> <b>{it.maCa}</b></div>
                            <div className="text-gray-600">NV: {it.maNhanVien}</div>
                          </div>
                          <StatusBadge value={it.trangThai} />
                        </div>
                        {it.ghiChu && <div className="mt-1 text-xs text-gray-600 line-clamp-2">{it.ghiChu}</div>}
                        <div className="mt-2 text-right">
                          <button className="text-blue-600 hover:text-blue-800 mr-3"><Edit size={16} /></button>
                          <button className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 text-xs text-gray-400 flex items-center">Không có ca</div>
                )}
              </div>
            );
          })}
        </div>

        {!loading && rows.length === 0 && (
          <div className="text-center text-gray-500 mt-6">Chưa có ca làm việc nào</div>
        )}
      </div>
    </div>
  );
}
