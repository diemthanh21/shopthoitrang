import { useEffect, useMemo, useRef, useState } from "react";
import {
  Gift,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Percent,
  ChevronDown,
} from "lucide-react";

import khuyenmaiService from "../services/khuyenmaiService";
import sanphamService from "../services/sanphamService";
import nhanvienService from "../services/nhanvienService";
import chitietsanphamService from "../services/chitietsanphamService";
import { useAuth } from "../contexts/AuthContext";

const VN_TZ_OFFSET_MINUTES = 7 * 60;
const DATETIME_LOCAL_REGEX =
  /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?$/;
const DATETIME_LOCAL_VALUE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DATE_ONLY_VALUE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const NUMERIC_TIMESTAMP_REGEX = /^\d+$/;
const VN_TIMEZONE = "Asia/Ho_Chi_Minh";
const VN_DATE_INPUT_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: VN_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const formatVnInputValue = (date) => {
  const parts = VN_DATE_INPUT_FORMATTER.formatToParts(date);
  const lookup = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }
  const year = lookup.year ?? "0000";
  const month = lookup.month ?? "01";
  const day = lookup.day ?? "01";
  const hour = lookup.hour ?? "00";
  const minute = lookup.minute ?? "00";
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const coerceDateValue = (raw) => {
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return new Date(raw);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (NUMERIC_TIMESTAMP_REGEX.test(trimmed)) {
      const ms = Number(trimmed);
      return Number.isNaN(ms) ? null : new Date(ms);
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// Hi?n th? ng?y gi? trong b?ng
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: VN_TIMEZONE,
      })
    : "";

// Chu?n ho? ISO -> value cho <input type="datetime-local> (gi? VN)
const toDateTimeLocal = (value) => {
  if (value == null || value === "") return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (DATETIME_LOCAL_VALUE_REGEX.test(trimmed)) {
      return trimmed;
    }

    const localMatch = trimmed.match(DATETIME_LOCAL_REGEX);
    if (localMatch && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      return `${localMatch[1]}T${localMatch[2]}`;
    }

    if (DATE_ONLY_VALUE_REGEX.test(trimmed)) {
      return `${trimmed}T00:00`;
    }

    const parsed = coerceDateValue(trimmed);
    return parsed ? formatVnInputValue(parsed) : "";
  }

  const parsed = coerceDateValue(value);
  return parsed ? formatVnInputValue(parsed) : "";
};

// Chu?n ho? value <input type="datetime-local"> (gi? Vi?t Nam) -> ISO UTC d? luu DB
const fromDateTimeLocalToVnIso = (localValue) => {
  if (!localValue) return null;
  const s = String(localValue).trim();
  const m = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})$/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);

  const utcMillis =
    Date.UTC(year, month, day, hour, minute) -
    VN_TZ_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcMillis).toISOString();
};

const PROMO_TYPES = [
  { value: "GIAM_PERCENT", label: "Giảm %", isDiscount: true, isGift: false },
  { value: "TANG", label: "Tặng", isDiscount: false, isGift: true },
];


const emptyForm = {
  tenChuongTrinh: "",
  loaiKhuyenMai: PROMO_TYPES[0].value,
  sanPhamApDungIds: [],
  sanPhamTangIds: [],
  sanPhamTangVariants: [], // [{productId, variantId, sizeId|null, quantity, buyQty, giftQty}]
  tyLeGiam: 0,
  ngayBatDau: "",
  ngayKetThuc: "",
  moTa: "",
  maNhanVien: "",
};

const detectTypeMeta = (type) => {
  if (!type) {
    return { isDiscount: false, isGift: false };
  }
  if (typeof type.isDiscount === "boolean" && typeof type.isGift === "boolean") {
    return { isDiscount: type.isDiscount, isGift: type.isGift };
  }
  const value = (type.value ?? type.tenLoai ?? type.tenloai ?? "")
    .toString()
    .toUpperCase();
  return {
    isDiscount: value.includes("GIAM"),
    isGift: value.includes("TANG"),
  };
};


const getTrangThaiKhuyenMai = (item) => {
  const now = Date.now();
  const startRaw = item.ngayBatDau ?? item.ngaybatdau;
  const endRaw = item.ngayKetThuc ?? item.ngayketthuc;
  if (!startRaw && !endRaw) {
    return {
      code: "UNKNOWN",
      label: "Không xác định",
      className: "bg-gray-100 text-gray-700",
    };
  }
  const startTime = startRaw ? new Date(startRaw).getTime() : null;
  const endTime = endRaw ? new Date(endRaw).getTime() : null;

  if (startTime && now < startTime) {
    return {
      code: "UPCOMING",
      label: "Sắp diễn ra",
      className: "bg-blue-100 text-blue-700",
    };
  }
  if (endTime && now > endTime) {
    return {
      code: "ENDED",
      label: "Đã kết thúc",
      className: "bg-red-100 text-red-700",
    };
  }
  return {
    code: "ONGOING",
    label: "Đang diễn ra",
    className: "bg-green-100 text-green-700",
  };
};

const toPositiveInt = (value, fallback = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
};

const safeParseJson = (raw, fallback = []) => {
  if (!raw && raw !== 0) return fallback;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (err) {
      console.warn("Không parse được JSON:", raw, err);
      return fallback;
    }
  }
  return fallback;
};

const getProductIds = (item, key, fallbackKey) => {
  let raw =
    item?.[key] ??
    item?.[key?.toLowerCase?.() ?? key] ??
    item?.[fallbackKey] ??
    item?.[fallbackKey?.toLowerCase?.() ?? fallbackKey];

  if (raw === undefined && key === "sanPhamApDungIds") {
    raw = item?.sanpham_apdung_ids ?? item?.m_apdung_ids;
  }
  if (raw === undefined && key === "sanPhamTangIds") {
    raw = item?.sanpham_tang_ids;
  }

  let ids = [];

  if (Array.isArray(raw)) {
    ids = raw.map((v) => String(v));
  } else if (typeof raw === "string") {
    const textValue = raw.trim();
    if (textValue) {
      const parsed = safeParseJson(textValue, null);
      if (parsed) {
        ids = parsed.map((v) => String(v));
      } else {
        ids = textValue
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean);
      }
    }
  } else if (raw != null && raw !== "") {
    ids = [String(raw)];
  }

  if (
    key === "sanPhamTangIds" &&
    (!ids || ids.length === 0) &&
    (item?.sanPhamTangVariants || item?.sanpham_tang_variants)
  ) {
    const variants = normalizeDbGiftVariants(
      item.sanPhamTangVariants ?? item.sanpham_tang_variants ?? []
    );
    const derived = Array.from(
      new Set(
        variants
          .map((entry) => entry.productId)
          .filter(
            (pid) =>
              pid !== undefined &&
              pid !== null &&
              pid !== "" &&
              pid !== "null"
          )
      )
    );
    if (derived.length) {
      ids = derived.map((pid) => String(pid));
    }
  }

  return ids;
};

// 🧠 ĐÃ THÊM: buyQty (Mua X) & giftQty (Tặng Y)
const normalizeDbGiftVariants = (raw) => {
  const arr = safeParseJson(raw, []);
  return arr
    .map((entry) => {
      const quantity = Number(entry.quantity ?? entry.soLuong ?? entry.qty ?? 0);
      const buyQty = toPositiveInt(
        entry.buyQty ?? entry.soLuongMua ?? entry.so_luong_mua ?? 1,
        1
      );
      const giftQty = toPositiveInt(
        entry.giftQty ?? entry.soLuongTang ?? entry.so_luong_tang ?? 1,
        1
      );
      return {
        productId:
          entry.productId ??
          entry.maSanPham ??
          entry.masanpham ??
          null,
        variantId: String(
          entry.variantId ??
            entry.maChiTietSanPham ??
            entry.machitietsanpham ??
            entry.id ??
            ""
        ),
        sizeId:
          entry.sizeId ??
          entry.kichThuocId ??
          entry.kichthuoc_id ??
          entry.chitietsize_id ??
          null,
        quantity: quantity > 0 ? quantity : 0,
        buyQty,
        giftQty,
      };
    })
    .filter((e) => e.variantId);
};

const resolveVariantId = (variant) =>
  String(
    variant?.maChiTietSanPham ??
      variant?.machitietsanpham ??
      variant?.id ??
      ""
  );

const getVariantColorName = (variant) =>
  variant?.mauSac ?? variant?.mausac ?? "Không rõ màu";

const buildSizeOptions = (variant) => {
  if (!variant) {
    return [
      {
        id: null,
        tenKichThuoc: "Tự do",
        soLuong: 0,
      },
    ];
  }
  if (Array.isArray(variant.sizes) && variant.sizes.length) {
    return variant.sizes.map((size) => ({
      id:
        size?.id ??
        size?.machitietsanpham_kichthuoc ??
        size?.bridgeId ??
        null,
      tenKichThuoc:
        size?.tenKichThuoc ??
        size?.ten_kichthuoc ??
        "Tự do",
      soLuong: toPositiveInt(size?.soLuong ?? size?.so_luong ?? 0, 0),
    }));
  }
  return [
    {
      id: null,
      tenKichThuoc: variant.kichThuoc ?? variant.kichthuoc ?? "Tự do",
      soLuong: toPositiveInt(
        variant.soLuongTon ?? variant.soluongton ?? 0,
        0
      ),
    },
  ];
};

const getSizeLabel = (size) =>
  size?.tenKichThuoc ?? size?.ten_kichthuoc ?? "Tự do";

const getStockForSelection = (variant, size) => {
  if (size) {
    return toPositiveInt(size.soLuong ?? size.so_luong ?? 0, 0);
  }
  return toPositiveInt(
    variant?.soLuongTon ?? variant?.soluongton ?? 0,
    0
  );
};

function ProductMultiSelect({
  label,
  placeholder,
  value = [],
  onChange,
  options = [],
  disabled = false,
  helperText,
}) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [keyword, options]);

  const toggleValue = (id) => {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const previewLabels = value
    .slice(0, 2)
    .map(
      (id) =>
        options.find((opt) => String(opt.value) === String(id))?.label ?? id
    );
  const remainder = value.length > 2 ? ` +${value.length - 2}` : "";
  const buttonLabel = value.length
    ? `${value.length} sản phẩm được chọn`
    : placeholder;

  return (
    <div className="relative space-y-2" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
            : "border-gray-300 bg-white text-gray-900 hover:border-blue-400"
        }`}
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown size={18} className="text-gray-400" />
      </button>
      {value.length > 0 && (
        <p className="text-xs text-gray-500">
          {previewLabels.join(", ")}
          {remainder}
        </p>
      )}
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Tìm theo mã / tên sản phẩm"
            />
          </div>
          <div className="max-h-56 overflow-auto px-2 pb-2">
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-center text-sm text-gray-500">
                Không tìm thấy sản phẩm phù hợp
              </p>
            )}
            {filteredOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={value.includes(opt.value)}
                  onChange={() => toggleValue(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KhuyenMaiPage() {
  const { user } = useAuth();

  const currentMaNhanVien =
    user?.maNhanVien ??
    user?.manhanvien ??
    user?.nhanVien?.maNhanVien ??
    user?.nhanvien?.manhanvien ??
    "";

  const currentTenNhanVien =
    user?.hoTen ??
    user?.hoten ??
    user?.nhanVien?.hoTen ??
    user?.nhanvien?.hoten ??
    user?.fullName ??
    "";

  const currentRoleCode = (
    user?.maQuyen ??
    user?.maquyen ??
    user?.role ??
    user?.quyen ??
    user?.nhanVien?.maQuyen ??
    user?.nhanvien?.maquyen ??
    user?.chucNang?.maQuyen ??
    user?.chucnang?.maquyen ??
    ""
  )
    .toString()
    .toUpperCase();

  const isAdminOrManager =
    currentRoleCode === "ADMIN" || currentRoleCode === "MANAGER";

  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [giftVariants, setGiftVariants] = useState({});
  const [giftSelectionDrafts, setGiftSelectionDrafts] = useState({});
  const [giftVariantLoading, setGiftVariantLoading] = useState(false);
  const [giftVariantError, setGiftVariantError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    ...emptyForm,
    maNhanVien: currentMaNhanVien || "",
  });

  const [showGiftDetailModal, setShowGiftDetailModal] = useState(false);
  const [giftDetailLoading, setGiftDetailLoading] = useState(false);
  const [giftDetailPromo, setGiftDetailPromo] = useState(null);
  const [giftDetailEntries, setGiftDetailEntries] = useState([]);

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: String(p.maSanPham ?? p.masanpham),
        label: `#${p.maSanPham ?? p.masanpham} - ${
          p.tenSanPham ?? p.tensanpham
        }`,
      })),
    [products]
  );

  const getLoaiKhuyenMai = (code) => {
    if (!code) return PROMO_TYPES[0];
    const normalized = code.toString().trim().toUpperCase();
    return (
      PROMO_TYPES.find((type) => type.value === normalized) ?? {
        value: normalized,
        label: normalized,
        isDiscount: normalized.includes("GIAM"),
        isGift: normalized.includes("TANG"),
      }
    );
  };

  const getTenSanPham = (id, includeCode = false) => {
    if (!id) return "";
    const found = products.find(
      (p) => String(p.maSanPham ?? p.masanpham) === String(id)
    );
    const name = found?.tenSanPham ?? found?.tensanpham ?? `SP #${id}`;
    const code = found?.maSanPham ?? found?.masanpham ?? id;
    return includeCode ? `#${code} - ${name}` : name;
  };

  const formatProductSelection = (ids) => {
    if (!ids.length) return "Tất cả sản phẩm / Không chọn";
    return ids.map((id) => getTenSanPham(id, true)).join(", ");
  };

  const getTenNhanVien = (id) => {
    if (!id) return "";
    const found = employees.find(
      (e) => String(e.maNhanVien ?? e.manhanvien) === String(id)
    );
    return found?.hoTen ?? found?.hoten ?? `NV #${id}`;
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [km, sp, nv] = await Promise.all([
          khuyenmaiService.getAll(),
          sanphamService.getAll(),
          nhanvienService.getAll(),
        ]);
        setItems(Array.isArray(km) ? km : km?.data ?? []);
        setProducts(Array.isArray(sp) ? sp : sp?.data ?? []);
        setEmployees(Array.isArray(nv) ? nv : nv?.data ?? []);
      } catch (err) {
        console.error(err);
        setError(
          "Không thể tải danh sách khuyến mãi / sản phẩm / nhân viên / loại khuyến mãi"
        );
        setItems([]);
        setProducts([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!term) return items;
    return items.filter((item) => {
      const maKM = item.maKhuyenMai ?? item.makhuyenmai;
      const tenCT = item.tenChuongTrinh ?? item.tenchuongtrinh;
      const typeInfo = getLoaiKhuyenMai(
        item.loaiKhuyenMai ?? item.loaikhuyenmai
      );
      const loai = typeInfo?.label ?? typeInfo?.value ?? "";
      const tenNV = getTenNhanVien(item.maNhanVien ?? item.manhanvien);
      const applyList = formatProductSelection(
        getProductIds(item, "sanPhamApDungIds", "maSanPham")
      );
      const giftList = formatProductSelection(
        getProductIds(item, "sanPhamTangIds", "maSanPhamTang")
      );
      const haystack = [
        maKM,
        tenCT,
        loai,
        tenNV,
        applyList,
        giftList,
        item.moTa ?? item.mota,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");
      return haystack.includes(term);
    });
  }, [items, term, products, employees]);

  // tải variants cho danh sách sản phẩm tặng đang chọn
  useEffect(() => {
    let ignore = false;
    const loadVariants = async () => {
      const ids = formData.sanPhamTangIds;
      if (!ids.length) {
        setGiftVariants({});
        setGiftVariantError("");
        setGiftSelectionDrafts({});
        return;
      }
      setGiftVariantLoading(true);
      setGiftVariantError("");
      try {
        const entries = await Promise.all(
          ids.map(async (productId) => {
            const variants = await chitietsanphamService.getByProductId(
              Number(productId)
            );
            return [String(productId), variants];
          })
        );
        if (ignore) return;
        const map = {};
        entries.forEach(([id, variants]) => {
          map[id] = variants || [];
        });
        setGiftVariants(map);
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setGiftVariantError("Không thể tải biến thể sản phẩm tặng");
          setGiftVariants({});
        }
      } finally {
        if (!ignore) {
          setGiftVariantLoading(false);
        }
      }
    };
    loadVariants();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.sanPhamTangIds.join(",")]);

  // khi edit, map productId cho các entry chưa có
  useEffect(() => {
    if (!editingItem) return;
    if (!Object.keys(giftVariants).length) return;

    setFormData((prev) => {
      if (!prev.sanPhamTangVariants?.length) return prev;
      let changed = false;

      const updated = prev.sanPhamTangVariants.map((entry) => {
        if (entry.productId) return entry;
        const variantId = String(entry.variantId);
        let foundProductId = null;
        for (const pid of prev.sanPhamTangIds || []) {
          const variants = giftVariants[String(pid)] ?? [];
          if (variants.some((v) => resolveVariantId(v) === variantId)) {
            foundProductId = String(pid);
            break;
          }
        }
        if (!foundProductId) return entry;
        changed = true;
        return { ...entry, productId: foundProductId };
      });

      return changed ? { ...prev, sanPhamTangVariants: updated } : prev;
    });
  }, [editingItem, giftVariants]);

  // map quantity hiện có theo variant+size
  const variantQuantityMap = useMemo(() => {
    const map = new Map();
    formData.sanPhamTangVariants.forEach((entry) => {
      const key = `${entry.variantId}:${entry.sizeId ?? "null"}`;
      map.set(key, entry.quantity);
    });
    return map;
  }, [formData.sanPhamTangVariants]);

  // thay đổi total quantity cho entry tồn tại
  const handleVariantQuantityChange = (
    productId,
    variantId,
    sizeId,
    rawValue,
    maxQty = 0
  ) => {
    const limit = Number(maxQty ?? 0);
    const numeric = Math.floor(
      Math.max(
        0,
        Math.min(Number.isFinite(limit) ? limit : 0, Number(rawValue) || 0)
      )
    );
    const normalizedSizeId =
      sizeId === undefined || sizeId === null || sizeId === "null"
        ? null
        : sizeId;

    setFormData((prev) => {
      const keyPair = `${String(variantId)}:${String(
        normalizedSizeId ?? "null"
      )}`;
      const existing = prev.sanPhamTangVariants.find(
        (entry) =>
          String(entry.variantId) === String(variantId) &&
          String(entry.sizeId ?? "null") ===
            String(normalizedSizeId ?? "null") &&
          String(entry.productId ?? "") === String(productId ?? "")
      );
      const filtered = prev.sanPhamTangVariants.filter(
        (entry) =>
          String(entry.variantId) !== String(variantId) ||
          String(entry.sizeId ?? "null") !==
            String(normalizedSizeId ?? "null") ||
          String(entry.productId ?? "") !== String(productId ?? "")
      );
      if (numeric > 0) {
        filtered.push({
          productId: productId ? String(productId) : null,
          variantId: String(variantId),
          sizeId: normalizedSizeId ? String(normalizedSizeId) : null,
          quantity: numeric,
          buyQty: existing?.buyQty ?? 1,
          giftQty: existing?.giftQty ?? 1,
        });
      }
      return { ...prev, sanPhamTangVariants: filtered };
    });
  };

  // thay đổi buyQty / giftQty cho entry đang áp dụng
  const handleGiftRatioChange = (
    productId,
    variantId,
    sizeId,
    field,
    rawValue
  ) => {
    const value = toPositiveInt(rawValue, 1) || 1;
    setFormData((prev) => {
      const updated = prev.sanPhamTangVariants.map((entry) => {
        if (
          String(entry.productId ?? "") === String(productId ?? "") &&
          String(entry.variantId) === String(variantId) &&
          String(entry.sizeId ?? "null") === String(sizeId ?? "null")
        ) {
          return {
            ...entry,
            [field]: value,
          };
        }
        return entry;
      });
      return { ...prev, sanPhamTangVariants: updated };
    });
  };

  // draft khi chuẩn bị thêm mới 1 biến thể
  const handleDraftChange = (productId, field, value) => {
    setGiftSelectionDrafts((prev) => {
      const key = String(productId);
      const variants = giftVariants[key] ?? [];
      const draft = { ...(prev[key] || {}) };

      if (field === "variantId") {
        draft.variantId = value;
      } else if (field === "sizeId") {
        draft.sizeId = value;
      } else if (field === "quantity") {
        draft.quantity = value;
      } else if (field === "buyQty") {
        draft.buyQty = value;
      } else if (field === "giftQty") {
        draft.giftQty = value;
      }

      const variant =
        variants.find(
          (v) => resolveVariantId(v) === String(draft.variantId || value || "")
        ) ?? variants[0];
      draft.variantId = variant ? resolveVariantId(variant) : "";

      const sizeRows = buildSizeOptions(variant);
      const desiredSizeId =
        field === "variantId" ? null : draft.sizeId ?? "null";
      const sizeMatch =
        sizeRows.find(
          (s) =>
            String(s.id ?? "null") === String(desiredSizeId ?? "null")
        ) ?? sizeRows[0];
      draft.sizeId = sizeMatch ? String(sizeMatch.id ?? "null") : "null";

      const maxQty = getStockForSelection(variant, sizeMatch);

      if (field === "quantity") {
        const qty = Math.floor(
          Math.max(1, Math.min(maxQty || 0, Number(value) || 0))
        );
        draft.quantity = qty > 0 ? String(qty) : "";
      } else {
        const currentQty = Number(draft.quantity ?? 1);
        const safeQty =
          Number.isFinite(currentQty) && currentQty > 0
            ? Math.min(currentQty, maxQty || currentQty)
            : maxQty > 0
            ? 1
            : "";
        draft.quantity = safeQty === "" ? "" : String(safeQty);
      }

      if (!draft.buyQty || Number(draft.buyQty) <= 0) {
        draft.buyQty = "1";
      }
      if (!draft.giftQty || Number(draft.giftQty) <= 0) {
        draft.giftQty = "1";
      }

      return { ...prev, [key]: draft };
    });
  };

  const handleAddGiftVariant = (productId) => {
    const key = String(productId);
    const draft = giftSelectionDrafts[key] || {};
    const variants = giftVariants[key] ?? [];

    const variant =
      variants.find(
        (v) => resolveVariantId(v) === String(draft.variantId || "")
      ) ?? variants[0];

    if (!variant) {
      alert("Vui lòng chọn màu sắc hợp lệ");
      return;
    }

    const sizeRows = buildSizeOptions(variant);
    const size =
      sizeRows.find(
        (row) =>
          String(row.id ?? "null") === String(draft.sizeId ?? "null")
      ) ?? sizeRows[0];

    const sizeId = size?.id ?? null;
    const variantId = resolveVariantId(variant);
    const pairKey = `${variantId}:${sizeId ?? "null"}`;

    if (variantQuantityMap.has(pairKey)) {
      alert("Biến thể này đã tồn tại, hãy chỉnh sửa ngay trong danh sách.");
      return;
    }

    const maxQty = getStockForSelection(variant, size);
    if (!maxQty) {
      alert("Biến thể này hiện không còn tồn kho để tặng.");
      return;
    }

    const desiredQty = Math.floor(
      Math.max(1, Math.min(maxQty, Number(draft.quantity) || 0))
    );
    if (!desiredQty) {
      alert("Vui lòng nhập số lượng khuyến mãi hợp lệ.");
      return;
    }

    const buyQty = toPositiveInt(draft.buyQty, 1) || 1;
    const giftQty = toPositiveInt(draft.giftQty, 1) || 1;
    if (!buyQty || !giftQty) {
      alert("Mua / Tặng phải là số nguyên dương.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      sanPhamTangVariants: [
        ...prev.sanPhamTangVariants,
        {
          productId: String(productId),
          variantId: String(variantId),
          sizeId: sizeId ? String(sizeId) : null,
          quantity: desiredQty,
          buyQty,
          giftQty,
        },
      ],
    }));
  };

  const handleRemoveGiftSelection = (productId, variantId, sizeId) => {
    setFormData((prev) => ({
      ...prev,
      sanPhamTangVariants: prev.sanPhamTangVariants.filter(
        (item) =>
          !(
            String(item.productId) === String(productId) &&
            String(item.variantId) === String(variantId) &&
            String(item.sizeId ?? "null") === String(sizeId ?? "null")
          )
      ),
    }));
  };

  const openAddForm = () => {
    if (!isAdminOrManager) {
      alert("Bạn không có quyền thêm khuyến mãi.");
      return;
    }
    setEditingItem(null);
    setFormData({
      ...emptyForm,
      maNhanVien: currentMaNhanVien || "",
    });
    setGiftVariants({});
    setGiftVariantError("");
    setGiftSelectionDrafts({});
    setShowForm(true);
  };

  const openEditForm = (item) => {
    if (!isAdminOrManager) {
      alert("Bạn không có quyền sửa khuyến mãi.");
      return;
    }

    const status = getTrangThaiKhuyenMai(item);
    if (status.code === "ENDED") {
      alert("Khuyến mãi đã kết thúc, không được sửa.");
      return;
    }

    const applyIds = getProductIds(item, "sanPhamApDungIds", "maSanPham");
    const giftIds = getProductIds(item, "sanPhamTangIds", "maSanPhamTang");

    const variantRaw =
      item.sanPhamTangVariants ?? item.sanpham_tang_variants ?? [];
    const variantSelections = normalizeDbGiftVariants(variantRaw);

    setEditingItem(item);
    setFormData({
      tenChuongTrinh: item.tenChuongTrinh ?? item.tenchuongtrinh ?? "",
      loaiKhuyenMai:
        (item.loaiKhuyenMai ?? item.loaikhuyenmai ?? "").toString().toUpperCase() ||
        PROMO_TYPES[0].value,
      sanPhamApDungIds: applyIds,
      sanPhamTangIds: giftIds,
      sanPhamTangVariants: variantSelections,
      tyLeGiam: Number(item.tyLeGiam ?? item.tylegiam ?? 0),
      ngayBatDau: toDateTimeLocal(item.ngayBatDau ?? item.ngaybatdau ?? ""),
      ngayKetThuc: toDateTimeLocal(item.ngayKetThuc ?? item.ngayketthuc ?? ""),
      moTa: item.moTa ?? item.mota ?? "",
      maNhanVien: String(
        item.maNhanVien ?? item.manhanvien ?? currentMaNhanVien ?? ""
      ),
    });
    setGiftVariantError("");
    setGiftSelectionDrafts({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      ...emptyForm,
      maNhanVien: currentMaNhanVien || "",
    });
    setGiftVariants({});
    setGiftVariantError("");
    setGiftSelectionDrafts({});
  };

  const selectedType = getLoaiKhuyenMai(formData.loaiKhuyenMai);
  const { isDiscount, isGift } = detectTypeMeta(selectedType);
  const disableGiftSelection = isDiscount;
  const disableApplySelection = false;

  const editingStatus = editingItem ? getTrangThaiKhuyenMai(editingItem) : null;
  const isEditingOngoing =
    !!editingItem && editingStatus?.code === "ONGOING";
  const isEditingUpcoming =
    !!editingItem && editingStatus?.code === "UPCOMING";

  const canEditAllFields =
    isAdminOrManager && (!editingItem || isEditingUpcoming);
  const canEditEndDate =
    isAdminOrManager &&
    (!editingItem || isEditingUpcoming || isEditingOngoing);
  const canSubmitForm =
    isAdminOrManager &&
    (!editingItem ||
      editingStatus?.code === "UPCOMING" ||
      editingStatus?.code === "ONGOING");

  const handleTypeChange = (value) => {
    if (!canEditAllFields) return;
    const type = getLoaiKhuyenMai(value);
    const meta = detectTypeMeta(type);
    setFormData((prev) => ({
      ...prev,
      loaiKhuyenMai: type.value,
      tyLeGiam: meta.isDiscount ? prev.tyLeGiam : 0,
      sanPhamTangIds: meta.isDiscount ? [] : prev.sanPhamTangIds,
      sanPhamTangVariants: meta.isDiscount ? [] : prev.sanPhamTangVariants,
    }));
  };

  const handleDelete = async (item) => {
    if (!isAdminOrManager) {
      alert("Bạn không có quyền xoá khuyến mãi.");
      return;
    }

    const status = getTrangThaiKhuyenMai(item);
    if (status.code === "ONGOING") {
      alert("Khuyến mãi đang diễn ra, không được xoá.");
      return;
    }
    if (status.code === "ENDED") {
      alert("Khuyến mãi đã kết thúc, không được xoá.");
      return;
    }

    if (
      !window.confirm("Bạn có chắc chắn muốn xoá chương trình khuyến mãi này?")
    )
      return;

    try {
      const id = item.maKhuyenMai ?? item.makhuyenmai;
      await khuyenmaiService.delete(id);
      const refreshed = await khuyenmaiService.getAll();
      setItems(Array.isArray(refreshed) ? refreshed : refreshed?.data ?? []);
    } catch (err) {
      console.error(err);
      alert("Không thể xoá khuyến mãi, vui lòng thử lại");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdminOrManager) {
      alert("Bạn không có quyền thao tác với khuyến mãi.");
      return;
    }
    if (!canSubmitForm) {
      alert("Không thể lưu với trạng thái hiện tại.");
      return;
    }

    if (!formData.tenChuongTrinh.trim()) {
      alert("Vui lòng nhập tên chương trình");
      return;
    }
    if (!formData.loaiKhuyenMai) {
      alert("Vui lòng chọn loại khuyến mãi");
      return;
    }
    if (!formData.ngayBatDau || !formData.ngayKetThuc) {
      alert("Vui lòng chọn ngày và giờ bắt đầu / kết thúc");
      return;
    }

    const startIso = fromDateTimeLocalToVnIso(formData.ngayBatDau);
    const endIso = fromDateTimeLocalToVnIso(formData.ngayKetThuc);

    if (!startIso || !endIso) {
      alert("Ngày giờ bắt đầu / kết thúc không hợp lệ");
      return;
    }

    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      alert("Ngày giờ bắt đầu / kết thúc không hợp lệ");
      return;
    }

    const now = new Date();
    const isNew = !editingItem;
    const isUpcomingEdit =
      !!editingItem && editingStatus?.code === "UPCOMING";

    if ((isNew || isUpcomingEdit) && start < now) {
      alert(
        "Ngày giờ bắt đầu phải từ thời điểm hiện tại trở đi (không được nhỏ hơn hiện tại)!"
      );
      return;
    }
    if (start >= end) {
      alert("Ngày giờ bắt đầu phải nhỏ hơn ngày giờ kết thúc");
      return;
    }
    if (end < now) {
      alert("Ngày giờ kết thúc phải từ thời điểm hiện tại trở đi");
      return;
    }

    if (
      isDiscount &&
      (Number(formData.tyLeGiam) <= 0 || Number(formData.tyLeGiam) > 100)
    ) {
      alert("Tỷ lệ giảm phải nằm trong khoảng 0 - 100");
      return;
    }

    if (isGift && formData.sanPhamTangVariants.length === 0) {
      alert("Vui lòng thêm ít nhất 1 biến thể tặng (màu/size, mua X tặng Y)");
      return;
    }

    // đảm bảo buyQty/giftQty hợp lệ
    if (isGift) {
      for (const entry of formData.sanPhamTangVariants) {
        const buy = toPositiveInt(entry.buyQty ?? 1, 1);
        const gift = toPositiveInt(entry.giftQty ?? 1, 1);
        if (!buy || !gift) {
          alert("Mua / Tặng của mỗi biến thể phải là số nguyên dương.");
          return;
        }
      }
    }

    const payload = {
      ...formData,
      loaiKhuyenMai: formData.loaiKhuyenMai,
      sanPhamApDungIds: disableApplySelection ? [] : formData.sanPhamApDungIds,
      sanPhamTangIds: disableGiftSelection ? [] : formData.sanPhamTangIds,
      sanPhamTangVariants: disableGiftSelection
        ? []
        : formData.sanPhamTangVariants.map((entry) => ({
            ...entry,
            buyQty: toPositiveInt(entry.buyQty ?? 1, 1),
            giftQty: toPositiveInt(entry.giftQty ?? 1, 1),
          })),
      tyLeGiam: Number(formData.tyLeGiam ?? 0),
      maNhanVien: currentMaNhanVien || formData.maNhanVien,
      ngayBatDau: startIso,
      ngayKetThuc: endIso,
    };

    try {
      setSaving(true);
      if (editingItem) {
        await khuyenmaiService.update(
          editingItem.maKhuyenMai ?? editingItem.makhuyenmai,
          payload
        );
      } else {
        await khuyenmaiService.create(payload);
      }
      const refreshed = await khuyenmaiService.getAll();
      setItems(Array.isArray(refreshed) ? refreshed : refreshed?.data ?? []);
      closeForm();
    } catch (err) {
      console.error(err);
      alert("Không thể lưu khuyến mãi, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  const openGiftDetailModal = async (item) => {
    const giftIds = getProductIds(item, "sanPhamTangIds", "maSanPhamTang");
    const variantRaw =
      item.sanPhamTangVariants ?? item.sanpham_tang_variants ?? [];
    const variantSelections = normalizeDbGiftVariants(variantRaw);

    if (!variantSelections.length) {
      alert("Khuyến mãi này chưa cấu hình sản phẩm tặng chi tiết.");
      return;
    }

    const derivedIds = giftIds.length
      ? giftIds
      : Array.from(
          new Set(
            variantSelections
              .map((entry) => entry.productId)
              .filter(
                (pid) =>
                  pid !== undefined &&
                  pid !== null &&
                  pid !== "" &&
                  pid !== "null"
              )
          )
        );

    if (!derivedIds.length) {
      alert("Khuyến mãi này chưa cấu hình sản phẩm tặng chi tiết.");
      return;
    }

    setShowGiftDetailModal(true);
    setGiftDetailPromo(item);
    setGiftDetailLoading(true);
    setGiftDetailEntries([]);

    try {
      const productVariantMap = {};
      for (const pid of derivedIds) {
        const variants = await chitietsanphamService.getByProductId(
          Number(pid)
        );
        productVariantMap[String(pid)] = variants || [];
      }

      const entries = variantSelections.map((entry) => {
        const variantId = String(entry.variantId);
        let productId = entry.productId ? String(entry.productId) : null;

        if (!productId) {
          for (const pid of derivedIds) {
            const variants = productVariantMap[String(pid)] ?? [];
            if (variants.some((v) => resolveVariantId(v) === variantId)) {
              productId = String(pid);
              break;
            }
          }
        }

        const product = products.find(
          (p) => String(p.maSanPham ?? p.masanpham) === String(productId)
        );
        const variantList = productVariantMap[String(productId)] ?? [];
        const variant = variantList.find(
          (v) => resolveVariantId(v) === variantId
        );
        const sizeRows = buildSizeOptions(variant);
        const size =
          sizeRows.find(
            (s) =>
              String(s.id ?? "null") === String(entry.sizeId ?? "null")
          ) ?? sizeRows[0];

        return {
          key:
            (productId || "?") +
            "-" +
            variantId +
            "-" +
            (entry.sizeId ?? "null"),
          productName:
            product?.tenSanPham ??
            product?.tensanpham ??
            (productId ? "SP #" + productId : "SP #?"),
          colorName: variant
            ? getVariantColorName(variant)
            : "Biến thể #" + variantId,
          sizeLabel: getSizeLabel(size),
          quantity: Number(entry.quantity ?? 0),
          buyQty: entry.buyQty ?? 1,
          giftQty: entry.giftQty ?? 1,
        };
      });

      setGiftDetailEntries(entries);
    } catch (err) {
      console.error("gift detail modal", err);
      alert("Không thể tải chi tiết sản phẩm tặng. Vui lòng thử lại");
    } finally {
      setGiftDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <Gift size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý khuyến mãi
            </h1>
            <p className="text-gray-600">
              Tạo và quản lý các chương trình khuyến mãi cho sản phẩm.
            </p>
          </div>
        </div>
        {isAdminOrManager && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} /> Thêm khuyến mãi
          </button>
        )}
      </div>

      {/* search + list */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm khuyến mãi theo mã, tên chương trình, loại, sản phẩm, nhân viên..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-16 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-8 py-12 text-center text-gray-500">
              Không tìm thấy chương trình khuyến mãi nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 text-left">Tên chương trình</th>
                    <th className="px-4 py-3 text-left">Loại</th>
                    <th className="px-4 py-3 text-left">
                      Sản phẩm áp dụng
                    </th>
                    <th className="px-4 py-3 text-left">Tỷ lệ</th>
                    <th className="px-4 py-3 text-left">Sản phẩm tặng</th>
                    <th className="px-4 py-3 text-left">
                      Ngày giờ bắt đầu
                    </th>
                    <th className="px-4 py-3 text-left">
                      Ngày giờ kết thúc
                    </th>
                    <th className="px-4 py-3 text-left">Nhân viên</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((item) => {
                    const applyIds = getProductIds(
                      item,
                      "sanPhamApDungIds",
                      "maSanPham"
                    );
                    const giftIds = getProductIds(
                      item,
                      "sanPhamTangIds",
                      "maSanPhamTang"
                    );
                    const loaiObj = getLoaiKhuyenMai(
                      item.loaiKhuyenMai ?? item.loaikhuyenmai
                    );
                    const loai = loaiObj?.label ?? loaiObj?.value ?? "";
                    const status = getTrangThaiKhuyenMai(item);
                    const hasGift = giftIds.length > 0;

                    const canEdit =
                      isAdminOrManager &&
                      (status.code === "UPCOMING" ||
                        status.code === "ONGOING");
                    const canDelete =
                      isAdminOrManager && status.code === "UPCOMING";

                    return (
                      <tr key={item.maKhuyenMai ?? item.makhuyenmai}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.tenChuongTrinh ?? item.tenchuongtrinh}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {loai || ""}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatProductSelection(applyIds)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.tyLeGiam ?? item.tylegiam ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {item.tyLeGiam ?? item.tylegiam}%
                            </span>
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {hasGift ? (
                            <button
                              type="button"
                              onClick={() => openGiftDetailModal(item)}
                              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              {giftIds
                                .map((id) => getTenSanPham(id, true))
                                .join(", ")}
                            </button>
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {fmtDate(item.ngayBatDau ?? item.ngaybatdau)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {fmtDate(item.ngayKetThuc ?? item.ngayketthuc)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {getTenNhanVien(item.maNhanVien ?? item.manhanvien)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={
                                canEdit ? () => openEditForm(item) : undefined
                              }
                              disabled={!canEdit}
                              className={`inline-flex items-center gap-1 text-sm ${
                                canEdit
                                  ? "text-blue-600 hover:text-blue-800"
                                  : "cursor-not-allowed text-gray-300"
                              }`}
                            >
                              <Edit size={16} />
                              Sửa
                            </button>
                            <button
                              onClick={
                                canDelete ? () => handleDelete(item) : undefined
                              }
                              disabled={!canDelete}
                              className={`inline-flex items-center gap-1 text-sm ${
                                canDelete
                                  ? "text-red-600 hover:text-red-800"
                                  : "cursor-not-allowed text-gray-300"
                              }`}
                            >
                              <Trash2 size={16} />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FORM THÊM / SỬA */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="flex w-full max-w-4xl max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  {editingItem ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi mới"}
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingItem
                    ? editingItem.tenChuongTrinh ??
                      editingItem.tenchuongtrinh
                    : "Chương trình khuyến mãi"}
                </h2>
                {isEditingOngoing && (
                  <p className="mt-1 text-xs text-orange-500">
                    Đang diễn ra: chỉ được chỉnh ngày kết thúc.
                  </p>
                )}
              </div>
              <button
                onClick={closeForm}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-5 overflow-y-auto px-6 py-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Tên chương trình <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tenChuongTrinh}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tenChuongTrinh: e.target.value,
                      }))
                    }
                    disabled={!canEditAllFields}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Loại khuyến mãi <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {PROMO_TYPES.map((type) => {
                      const selected = formData.loaiKhuyenMai === type.value;
                      return (
                        <label
                          key={type.value}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                            selected
                              ? "border-blue-500 text-blue-600"
                              : "border-gray-300 text-gray-600"
                          } ${!canEditAllFields ? "opacity-60" : ""}`}
                        >
                          <input
                            type="radio"
                            className="text-blue-600 focus:ring-blue-500"
                            checked={selected}
                            value={type.value}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            disabled={!canEditAllFields}
                          />
                          {type.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Tỷ lệ giảm (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!isDiscount || !canEditAllFields}
                    value={formData.tyLeGiam}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tyLeGiam: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nhân viên tạo
                  </label>
                  <input
                    type="text"
                    value={
                      currentTenNhanVien ||
                      getTenNhanVien(formData.maNhanVien) ||
                      "Không xác định"
                    }
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <ProductMultiSelect
                  label="Sản phẩm áp dụng"
                  placeholder="Chọn sản phẩm áp dụng"
                  value={formData.sanPhamApDungIds}
                  onChange={(ids) =>
                    setFormData((prev) => ({ ...prev, sanPhamApDungIds: ids }))
                  }
                  options={productOptions}
                  disabled={disableApplySelection || !canEditAllFields}
                  helperText={
                    disableApplySelection
                      ? "Loại khuyến mãi này không chọn sản phẩm áp dụng."
                      : undefined
                  }
                />
                <ProductMultiSelect
                  label="Sản phẩm tặng"
                  placeholder="Chọn sản phẩm tặng"
                  value={formData.sanPhamTangIds}
                  onChange={(ids) =>
                    setFormData((prev) => ({ ...prev, sanPhamTangIds: ids }))
                  }
                  options={productOptions}
                  disabled={disableGiftSelection || !canEditAllFields}
                  helperText={
                    disableGiftSelection
                      ? "Loại khuyến mãi giảm giá không tặng sản phẩm."
                      : "Áp dụng cho các khuyến mãi kiểu Mua X tặng Y."
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Ngày giờ bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ngayBatDau}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ngayBatDau: e.target.value,
                      }))
                    }
                    disabled={!canEditAllFields}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Ngày giờ kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ngayKetThuc}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ngayKetThuc: e.target.value,
                      }))
                    }
                    disabled={!canEditEndDate}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* CẤU HÌNH MUA X TẶNG Y THEO BIẾN THỂ */}
              {!disableGiftSelection && (
                <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-blue-900">
                        Biến thể sản phẩm tặng (Mua X tặng Y)
                      </p>
                      {giftVariantLoading && (
                        <span className="text-xs text-blue-600">
                          Đang tải biến thể...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-700/80">
                      Ví dụ: Mua 1 tặng 1, Mua 2 tặng 1... Mỗi màu/size có thể
                      cấu hình khác nhau, hạn mức tặng dựa trên tồn kho.
                    </p>
                    
                    {giftVariantError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {giftVariantError}
                      </div>
                    )}
                  </div>

                  {formData.sanPhamTangIds.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Hãy chọn sản phẩm tặng để cấu hình biến thể.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {formData.sanPhamTangIds.map((productId) => {
                        const key = String(productId);
                        const productLabel = getTenSanPham(productId, true);
                        const variants = giftVariants[key] ?? [];
                        const draft = giftSelectionDrafts[key] || {};
                        const variant =
                          variants.find(
                            (v) =>
                              resolveVariantId(v) ===
                              String(draft.variantId || "")
                          ) ?? variants[0];
                        const sizeRows = buildSizeOptions(variant);
                        const size =
                          sizeRows.find(
                            (row) =>
                              String(row.id ?? "null") ===
                              String(draft.sizeId ?? "null")
                          ) ?? sizeRows[0];
                        const draftMaxQty = getStockForSelection(
                          variant,
                          size
                        );
                        const draftQuantity =
                          draft.quantity ?? (draftMaxQty > 0 ? "1" : "");
                        const selections =
                          formData.sanPhamTangVariants.filter(
                            (entry) =>
                              String(entry.productId ?? productId) ===
                              String(productId)
                          );

                        const giftDisabled = !canEditAllFields;

                        const draftBuyQty =
                          draft.buyQty && Number(draft.buyQty) > 0
                            ? draft.buyQty
                            : "1";
                        const draftGiftQty =
                          draft.giftQty && Number(draft.giftQty) > 0
                            ? draft.giftQty
                            : "1";

                        return (
                          <div
                            key={productId}
                            className="rounded-2xl border border-white bg-white p-4 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-50 pb-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {productLabel}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {variants.length
                                    ? `${variants.length} mẫu sắc | ${sizeRows.length} kích thước`
                                    : "Chưa có biến thể khả dụng"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (giftDisabled) return;
                                  setFormData((prev) => ({
                                    ...prev,
                                    sanPhamTangVariants:
                                      prev.sanPhamTangVariants.filter(
                                        (entry) =>
                                          String(entry.productId) !==
                                          String(productId)
                                      ),
                                  }));
                                  setGiftSelectionDrafts((prev) => {
                                    const cloned = { ...prev };
                                    delete cloned[key];
                                    return cloned;
                                  });
                                }}
                                disabled={giftDisabled}
                                className={`text-xs font-medium ${
                                  giftDisabled
                                    ? "cursor-not-allowed text-gray-300"
                                    : "text-red-500 hover:text-red-600"
                                }`}
                              >
                                Xóa toàn bộ biến thể
                              </button>
                            </div>

                            <div className="mt-3 grid gap-4 lg:grid-cols-2">
                              {/* ĐANG ÁP DỤNG */}
                              <div className="space-y-3 rounded-XL border border-blue-100/70 bg-blue-50/50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                                  Đang áp dụng
                                </p>
                                <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                                  {selections.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                      Chưa thêm biến thể nào.
                                    </p>
                                  ) : (
                                    selections.map((entry) => {
                                      const currentVariant = variants.find(
                                        (item) =>
                                          resolveVariantId(item) ===
                                          String(entry.variantId)
                                      );
                                      const sizeOptions =
                                        buildSizeOptions(currentVariant);
                                      const currentSize =
                                        sizeOptions.find(
                                          (row) =>
                                            String(row.id ?? "null") ===
                                            String(
                                              entry.sizeId ?? "null"
                                            )
                                        ) ?? sizeOptions[0];
                                      const maxQty = getStockForSelection(
                                        currentVariant,
                                        currentSize
                                      );
                                      const buyVal =
                                        entry.buyQty ?? entry.soLuongMua ?? 1;
                                      const giftVal =
                                        entry.giftQty ??
                                        entry.soLuongTang ??
                                        1;

                                      return (
                                        <div
                                          key={`${entry.productId}-${entry.variantId}:${
                                            entry.sizeId ?? "null"
                                          }`}
                                          className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm shadow-sm"
                                        >
                                          <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                              <p className="font-semibold text-gray-900">
                                                {currentVariant
                                                  ? getVariantColorName(
                                                      currentVariant
                                                    )
                                                  : `#${entry.variantId}`}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                Size:{" "}
                                                {getSizeLabel(currentSize)} - Tồn
                                                kho: {maxQty}
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveGiftSelection(
                                                  productId,
                                                  entry.variantId,
                                                  entry.sizeId
                                                )
                                              }
                                              disabled={giftDisabled}
                                              className={`rounded-full p-1 ${
                                                giftDisabled
                                                  ? "cursor-not-allowed text-gray-300"
                                                  : "text-gray-400 hover:text-red-500"
                                              }`}
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>

                                          <div className="grid grid-cols-3 gap-2">
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-medium text-gray-500">
                                                Mua
                                              </label>
                                              <input
                                                type="number"
                                                min="1"
                                                value={buyVal}
                                                disabled={giftDisabled}
                                                onChange={(e) =>
                                                  handleGiftRatioChange(
                                                    productId,
                                                    entry.variantId,
                                                    entry.sizeId ?? "null",
                                                    "buyQty",
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-medium text-gray-500">
                                                Tặng
                                              </label>
                                              <input
                                                type="number"
                                                min="1"
                                                value={giftVal}
                                                disabled={giftDisabled}
                                                onChange={(e) =>
                                                  handleGiftRatioChange(
                                                    productId,
                                                    entry.variantId,
                                                    entry.sizeId ?? "null",
                                                    "giftQty",
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-medium text-gray-500">
                                                Hạn mức KM
                                              </label>
                                              <input
                                                type="number"
                                                min="0"
                                                max={maxQty}
                                                value={entry.quantity}
                                                onChange={(e) =>
                                                  handleVariantQuantityChange(
                                                    productId,
                                                    entry.variantId,
                                                    entry.sizeId ?? "null",
                                                    e.target.value,
                                                    maxQty
                                                  )
                                                }
                                                disabled={giftDisabled}
                                                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>

                              {/* THÊM MỚI */}
                              <div className="space-y-3 rounded-xl border border-dashed border-blue-200 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                                  Thêm biến thể tặng
                                </p>
                                {variants.length === 0 ? (
                                  <p className="text-sm text-gray-500">
                                    Chưa có dữ liệu biến thể cho sản phẩm này.
                                  </p>
                                ) : (
                                  <>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">
                                          Màu sắc
                                        </label>
                                        <select
                                          value={draft.variantId ?? ""}
                                          onChange={(e) =>
                                            handleDraftChange(
                                              productId,
                                              "variantId",
                                              e.target.value
                                            )
                                          }
                                          disabled={giftDisabled}
                                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                        >
                                          {variants.map((variantRow) => (
                                            <option
                                              key={resolveVariantId(
                                                variantRow
                                              )}
                                              value={resolveVariantId(
                                                variantRow
                                              )}
                                            >
                                              {getVariantColorName(
                                                variantRow
                                              )}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">
                                          Kích thước
                                        </label>
                                        <select
                                          value={draft.sizeId ?? "null"}
                                          onChange={(e) =>
                                            handleDraftChange(
                                              productId,
                                              "sizeId",
                                              e.target.value
                                            )
                                          }
                                          disabled={giftDisabled}
                                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                        >
                                          {sizeRows.map((sizeOption) => (
                                            <option
                                              key={String(
                                                sizeOption.id ?? "null"
                                              )}
                                              value={String(
                                                sizeOption.id ?? "null"
                                              )}
                                            >
                                              {getSizeLabel(sizeOption)} | Tồn{" "}
                                              {sizeOption.soLuong ?? 0}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">
                                          Mua
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={draftBuyQty}
                                          disabled={giftDisabled}
                                          onChange={(e) =>
                                            handleDraftChange(
                                              productId,
                                              "buyQty",
                                              e.target.value
                                            )
                                          }
                                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">
                                          Tặng
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={draftGiftQty}
                                          disabled={giftDisabled}
                                          onChange={(e) =>
                                            handleDraftChange(
                                              productId,
                                              "giftQty",
                                              e.target.value
                                            )
                                          }
                                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">
                                          Hạn mức KM
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          max={draftMaxQty}
                                          value={draftQuantity}
                                          disabled={giftDisabled}
                                          onChange={(e) =>
                                            handleDraftChange(
                                              productId,
                                              "quantity",
                                              e.target.value
                                            )
                                          }
                                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-gray-500">
                                        Tồn kho khả dụng: {draftMaxQty}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAddGiftVariant(productId)
                                        }
                                        disabled={
                                          giftDisabled ||
                                          !draft.variantId ||
                                          !draftMaxQty
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        <Plus size={16} />
                                        Thêm biến thể
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Mô tả
                </label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, moTa: e.target.value }))
                  }
                  rows={3}
                  disabled={!canEditAllFields}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Ghi chú thêm về chương trình khuyến mãi..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving || !canSubmitForm}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save size={18} />
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT SẢN PHẨM TẶNG */}
      {showGiftDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Chi tiết sản phẩm tặng
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {giftDetailPromo?.tenChuongTrinh ??
                    giftDetailPromo?.tenchuongtrinh ??
                    ""}
                </h2>
              </div>
              <button
                onClick={() => setShowGiftDetailModal(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-3">
              {giftDetailLoading ? (
                <p className="text-sm text-gray-500">
                  Đang tải chi tiết sản phẩm tặng...
                </p>
              ) : giftDetailEntries.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Không có cấu hình sản phẩm tặng.
                </p>
              ) : (
                giftDetailEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {entry.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.colorName} - Size: {entry.sizeLabel}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Mua {entry.buyQty} tặng {entry.giftQty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-blue-600">
                      Hạn mức: {entry.quantity} sp tặng
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
