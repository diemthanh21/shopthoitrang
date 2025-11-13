// src/pages/PhanCongCaPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Plus, Search, Edit, Trash2, X } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import phancongService from "../services/phancongcaService";
import nhanvienService from "../services/nhanvienService";
import calamviecService from "../services/calamviecService";

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
  return new Date(y, m - 1, 1).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
};
const daysGrid = (ym) => {
  // tạo 6x7 ô (thứ 2 – CN)
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

const fmtVNDate = (s) => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("vi-VN");
};

function StatusBadge({ value }) {
  const cls =
    value === "Phân công"
      ? "bg-blue-100 text-blue-700"
      : value === "Đã hoàn thành"
      ? "bg-green-100 text-green-700"
      : value === "Vắng mặt"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${cls}`}>
      {value || ""}
    </span>
  );
}

// ====== MÀU CHO TỪNG CA ======
// Mỗi maCa luôn map vào 1 màu ổn định, không phụ thuộc tên ca,
// dùng hash nhỏ trên chuỗi maCa để tránh phụ thuộc số tăng dần.
const CA_COLOR_PALETTE = [
  "border-blue-200 bg-blue-50",
  "border-emerald-200 bg-emerald-50",
  "border-amber-200 bg-amber-50",
  "border-purple-200 bg-purple-50",
  "border-rose-200 bg-rose-50",
  "border-teal-200 bg-teal-50",
  "border-pink-200 bg-pink-50",
  "border-indigo-200 bg-indigo-50",
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const caColorClass = (maCa) => {
  if (!maCa) return "border-gray-200 bg-gray-50";
  const key = String(maCa);
  const h = hashString(key);
  const idx = h % CA_COLOR_PALETTE.length;
  return CA_COLOR_PALETTE[idx];
};

export default function PhanCongCaPage() {
  const { user } = useAuth();

  // CHỈNH QUYỀN Ở ĐÂY:
  // - chỉ ADMIN:  const canEdit = user?.maQuyen === "ADMIN";
  const canEdit = ["ADMIN", "MANAGER"].includes(user?.maQuyen);

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

  // master data
  const [nhanVienList, setNhanVienList] = useState([]);
  const [caList, setCaList] = useState([]);

  // panel chi tiết bên phải
  const [selected, setSelected] = useState(null);

  // modal thêm/sửa
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    maNhanVien: "",
    maCa: "",
    ngayLamViec: "",
    trangThai: "Phân công",
    ghiChu: "",
  });

  const from = useMemo(() => startOfMonthStr(ym), [ym]);
  const to = useMemo(() => endOfMonthStr(ym), [ym]);
  const grid = useMemo(() => daysGrid(ym), [ym]);

  // 2) Cache theo key 'from|to'
  const cacheRef = useRef(new Map());
  // 3) AbortController để hủy request cũ
  const abortRef = useRef(null);

  // ====== load master data: nhân viên + ca làm việc ======
  useEffect(() => {
    (async () => {
      try {
        const [nvRes, caRes] = await Promise.all([
          nhanvienService.getAll(),
          calamviecService.getAll(),
        ]);
        setNhanVienList(nvRes);
        setCaList(caRes);
      } catch (e) {
        console.error("Lỗi tải danh sách nhân viên / ca làm việc:", e);
      }
    })();
  }, []);

  const nhanVienMap = useMemo(() => {
    const m = {};
    nhanVienList.forEach((nv) => {
      m[nv.maNhanVien] = nv.hoTen ?? `NV #${nv.maNhanVien}`;
    });
    return m;
  }, [nhanVienList]);

  const caNameMap = useMemo(() => {
    const m = {};
    caList.forEach((c) => {
      m[c.maCa] = c.tenCa ?? `Ca #${c.maCa}`;
    });
    return m;
  }, [caList]);

  const caTimeMap = useMemo(() => {
    const m = {};
    caList.forEach((c) => {
      m[c.maCa] = `${c.gioBatDau ?? ""} - ${c.gioKetThuc ?? ""}`;
    });
    return m;
  }, [caList]);

  // ====== load phân công theo tháng ======
  useEffect(() => {
    const key = `${from}|${to}`;

    // cache hit
    if (cacheRef.current.has(key)) {
      setRows(cacheRef.current.get(key));
      setErr("");
      return;
    }

    // hủy request trước
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        const data = await phancongService.getByDateRange(from, to, {
          signal: controller.signal,
        });
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

  // Lọc theo search + trạng thái rồi group theo ngày
  const byDay = useMemo(() => {
    const idx = {};
    const term = search.trim().toLowerCase();
    for (const it of rows) {
      if (stFilter && it.trangThai !== stFilter) continue;
      if (term) {
        const hay = [
          it.maPhanCong,
          it.maNhanVien,
          nhanVienMap[it.maNhanVien],
          it.maCa,
          caNameMap[it.maCa],
          it.ngayLamViec,
          it.trangThai,
          it.ghiChu,
          it.nguoiPhanCong,
        ]
          .map((v) => String(v ?? ""))
          .join(" ")
          .toLowerCase();
        if (!hay.includes(term)) continue;
      }
      (idx[it.ngayLamViec] ??= []).push(it);
    }
    return idx;
  }, [rows, search, stFilter, nhanVienMap, caNameMap]);

  const goto = (delta) => setYm((cur) => addMonths(cur, delta));

  // ====== Modal helpers ======
  const openNewModal = () => {
    if (!canEdit) return; // chặn nhân viên
    const todayStr = new Date().toISOString().slice(0, 10);
    setEditing(null);
    setForm({
      maNhanVien: "",
      maCa: "",
      ngayLamViec: todayStr,
      trangThai: "Phân công",
      ghiChu: "",
    });
    setShowModal(true);
  };

  const openEditModal = (row) => {
    if (!canEdit) return; // chặn nhân viên
    setEditing(row);
    setForm({
      maNhanVien: row.maNhanVien ?? "",
      maCa: row.maCa ?? "",
      ngayLamViec: row.ngayLamViec ?? new Date().toISOString().slice(0, 10),
      trangThai: row.trangThai ?? "Phân công",
      ghiChu: row.ghiChu ?? "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleChangeField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Bạn không có quyền chỉnh sửa phân công ca.");
      return;
    }

    if (!form.maNhanVien || !form.maCa || !form.ngayLamViec) {
      alert("Vui lòng chọn nhân viên, ca làm việc và ngày làm việc");
      return;
    }

    try {
      setLoading(true);

      if (editing) {
        await phancongService.update(editing.maPhanCong, {
          ...editing,
          ...form,
        });
      } else {
        await phancongService.create({
          ...form,
        });
      }

      // clear cache & reload
      cacheRef.current.clear();
      setShowModal(false);
      setEditing(null);
      const data = await phancongService.getByDateRange(from, to);
      cacheRef.current.set(`${from}|${to}`, data);
      setRows(data);
      alert(
        editing
          ? "Cập nhật phân công thành công!"
          : "Thêm phân công ca mới thành công!"
      );
    } catch (err2) {
      console.error("Lỗi lưu phân công ca:", err2);
      alert("Có lỗi xảy ra khi lưu phân công ca làm việc");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (!canEdit) {
      alert("Bạn không có quyền xoá phân công ca.");
      return;
    }
    if (!window.confirm("Bạn chắc chắn muốn xoá phân công này?")) return;
    try {
      setLoading(true);
      await phancongService.delete(row.maPhanCong);
      cacheRef.current.clear();
      const data = await phancongService.getByDateRange(from, to);
      cacheRef.current.set(`${from}|${to}`, data);
      setRows(data);
      if (selected?.maPhanCong === row.maPhanCong) setSelected(null);
    } catch (e) {
      console.error("Lỗi xoá phân công ca:", e);
      alert("Không thể xoá phân công ca");
    } finally {
      setLoading(false);
    }
  };

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
          <input
            type="month"
            value={ym}
            onChange={(e) => setYm(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={() => goto(-1)}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          >
            ←
          </button>
          <div className="min-w-40 text-center font-semibold">
            {viMonthTitle(ym)}
          </div>
          <button
            onClick={() => goto(1)}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          >
            →
          </button>

          {canEdit && (
            <button
              onClick={openNewModal}
              className="ml-2 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} /> Thêm ca làm việc
            </button>
          )}
        </div>
      </div>

      {/* Filter/Search */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {err}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã phân công, nhân viên, ca, ghi chú, trạng thái…"
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={stFilter}
            onChange={(e) => setStFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Tất cả trạng thái</option>
            <option>Phân công</option>
            <option>Đã hoàn thành</option>
            <option>Vắng mặt</option>
          </select>
        </div>
      </div>

      {/* Calendar + detail panel */}
      <div className="flex gap-4">
        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-xl border shadow-sm p-4">
          <div className="grid grid-cols-7 gap-3 text-sm font-semibold text-gray-600 px-1">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-3">
            {grid.map(({ key, date, inMonth }) => {
              const list = byDay[key] ?? [];
              return (
                <div
                  key={key}
                  className={`min-h-[120px] rounded-xl border p-2 flex flex-col gap-1 ${
                    inMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                  }`}
                >
                  <div className="text-sm font-medium">{date.getDate()}</div>

                  {list.length ? (
                    <div className="mt-1 flex-1 space-y-1 overflow-y-auto pr-1">
                      {list.map((it) => {
                        const nvName =
                          nhanVienMap[it.maNhanVien] || `NV #${it.maNhanVien}`;
                        const tenCa = caNameMap[it.maCa] || `Ca #${it.maCa}`;
                        const colorClass = caColorClass(it.maCa);

                        return (
                          <div
                            key={it.maPhanCong}
                            className={`border rounded-lg p-2 text-xs ${colorClass}`}
                          >
                            {/* chỉ hiển thị tên ca + tên NV + nút Chi tiết */}
                            <div className="font-semibold">{tenCa}</div>
                            <div className="text-gray-700 mt-0.5">
                              NV: {nvName}
                            </div>

                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setSelected(it)}
                                className="text-xs text-blue-700 hover:underline"
                              >
                                Chi tiết
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 text-xs text-gray-400 flex items-center">
                      Không có ca
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!loading && rows.length === 0 && (
            <div className="text-center text-gray-500 mt-6">
              Chưa có ca làm việc nào
            </div>
          )}
        </div>

        {/* Panel chi tiết bên phải: chỉ hiện khi đã chọn ca */}
        {selected && (
          <div className="w-80 bg-white rounded-xl border shadow-sm p-4 hidden lg:block">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-red-500">Chi tiết</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {(() => {
              const nvName =
                nhanVienMap[selected.maNhanVien] ||
                `NV #${selected.maNhanVien}`;
              const tenCa = caNameMap[selected.maCa] || `Ca #${selected.maCa}`;
              const timeStr = caTimeMap[selected.maCa] || "";
              return (
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs uppercase">
                      Ngày làm việc
                    </div>
                    <div className="font-medium">
                      {fmtVNDate(selected.ngayLamViec)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase">
                      Ca làm việc
                    </div>
                    <div className="font-medium">
                      {tenCa} (Ca: {selected.maCa})
                    </div>
                    {timeStr && (
                      <div className="text-gray-600 text-xs">{timeStr}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase">
                      Nhân viên
                    </div>
                    <div className="font-medium">{nvName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase">
                      Trạng thái
                    </div>
                    <StatusBadge value={selected.trangThai} />
                  </div>
                  {selected.ghiChu && (
                    <div>
                      <div className="text-gray-500 text-xs uppercase">
                        Ghi chú
                      </div>
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {selected.ghiChu}
                      </div>
                    </div>
                  )}
                  {selected.nguoiPhanCong && (
                    <div>
                      <div className="text-gray-500 text-xs uppercase">
                        Người phân công
                      </div>
                      <div className="text-gray-700">
                        {selected.nguoiPhanCong}
                      </div>
                    </div>
                  )}
                  {selected.ngayPhanCong && (
                    <div>
                      <div className="text-gray-500 text-xs uppercase">
                        Ngày phân công
                      </div>
                      <div className="text-gray-700">
                        {fmtVNDate(selected.ngayPhanCong)}
                      </div>
                    </div>
                  )}

                  {/* nút sửa/xoá chỉ cho tài khoản có quyền */}
                  {canEdit && (
                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(selected)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 border rounded-lg text-blue-700 hover:bg-blue-50"
                      >
                        <Edit size={16} />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selected)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 border rounded-lg text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Modal thêm / sửa phân công ca */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? "Chỉnh sửa phân công ca" : "Thêm phân công ca mới"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {/* Nhân viên */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Nhân viên <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.maNhanVien}
                    onChange={(e) => handleChangeField("maNhanVien", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {nhanVienList.map((nv) => (
                      <option key={nv.maNhanVien} value={nv.maNhanVien}>
                        {nv.hoTen}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ca làm việc */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Ca làm việc <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.maCa}
                    onChange={(e) => handleChangeField("maCa", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn ca --</option>
                    {caList.map((c) => (
                      <option key={c.maCa} value={c.maCa}>
                        {c.tenCa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Ngày làm việc */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Ngày làm việc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.ngayLamViec}
                    onChange={(e) =>
                      handleChangeField("ngayLamViec", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={form.trangThai}
                    onChange={(e) =>
                      handleChangeField("trangThai", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Phân công</option>
                    <option>Đã hoàn thành</option>
                    <option>Vắng mặt</option>
                  </select>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  value={form.ghiChu}
                  onChange={(e) => handleChangeField("ghiChu", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Thông tin thêm về ca làm việc (nếu có)…"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !canEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {loading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}