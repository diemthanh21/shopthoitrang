// src/pages/SanPhamDetailPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronUp,
  Edit2,
  Plus,
  Save,
  X,
} from "lucide-react";

import sanphamService from "../services/sanphamService";
import danhmucService from "../services/danhmucService";
import chitietsanphamService from "../services/chitietsanphamService";
import hinhanhsanphamService from "../services/hinhanhsanphamService";

// Supabase client
import { supabase } from "../utils/supabaseClient.js";
import kichthuocService from "../services/kichthuocService";

// tên bucket lưu ảnh (đã cấu hình trong .env)
const SUPABASE_BUCKET =
  import.meta.env.VITE_SUPABASE_BUCKET || "chitietsanpham";

const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

export default function SanPhamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);

  const [danhMucList, setDanhMucList] = useState([]);
  const [danhMucMap, setDanhMucMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ----- edit header (thông tin sản phẩm) -----
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    tenSanPham: "",
    maDanhMuc: "",
    trangThai: true,
    moTa: "",
  });

  // ----- modal thêm / sửa biến thể -----
  const createEmptySizeRow = () => ({
    tempId: `${Date.now()}-${Math.random()}`,
    maKichThuoc: "",
    soLuong: 0,
  });

  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({
    mauSac: "",
    chatLieu: "",
    giaBan: 0,
    moTa: "",
  });
  const [variantSizes, setVariantSizes] = useState(() => [createEmptySizeRow()]);
  const [variantFiles, setVariantFiles] = useState([]); // { id, file, preview }
  const [saving, setSaving] = useState(false);
  const [sizeCatalog, setSizeCatalog] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [sizeErr, setSizeErr] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef(null);
  const [showOverview, setShowOverview] = useState(true);

  const loadSizeCatalog = useCallback(async () => {
    try {
      setLoadingSizes(true);
      setSizeErr("");
      const data = await kichthuocService.getAll();
      setSizeCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Không thể tải danh sách kích thước:", err);
      setSizeErr("Không thể tải danh sách kích thước");
      setSizeCatalog([]);
    } finally {
      setLoadingSizes(false);
    }
  }, []);

  // ===== LOAD DATA CHÍNH =====
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadSizeCatalog();
  }, [loadSizeCatalog]);

  const sizeLabelMap = useMemo(() => {
    const map = new Map();
    sizeCatalog.forEach((size) => {
      const id = String(size.maKichThuoc ?? size.makichthuoc ?? "");
      const label = size.tenKichThuoc ?? size.ten_kichthuoc ?? "";
      if (id && label) {
        map.set(id, label);
      }
    });
    return map;
  }, [sizeCatalog]);

  const handleAddVariantSize = () => {
    setVariantSizes((rows) => [...rows, createEmptySizeRow()]);
  };

  const handleRemoveVariantSize = (tempId) => {
    setVariantSizes((rows) =>
      rows.length <= 1 ? [createEmptySizeRow()] : rows.filter((row) => row.tempId !== tempId)
    );
  };

  const clearVariantFiles = useCallback(() => {
    setVariantFiles((items) => {
      items.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
      return [];
    });
  }, []);

  const handleRemoveVariantFile = useCallback((id) => {
    setVariantFiles((items) => {
      const target = items.find((item) => item.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return items.filter((item) => item.id !== id);
    });
  }, []);

  const handleVariantSizeChange = (tempId, field, value) => {
    setVariantSizes((rows) =>
      rows.map((row) =>
        row.tempId === tempId
          ? { ...row, [field]: field === "maKichThuoc" ? value : value }
          : row
      )
    );
  };

  const loadData = async () => {
    setLoading(true);
    setErr("");

    try {
      const [spRes, ctspRes, dmRes, imgRes] = await Promise.all([
        sanphamService.getById(id),
        chitietsanphamService.getByProductId(id),
        danhmucService.getAll(),
        hinhanhsanphamService.getAll(),
      ]);

      setProduct(spRes || null);

      let ctsps = [];
      if (Array.isArray(ctspRes)) {
        ctsps = ctspRes;
      } else if (ctspRes && Array.isArray(ctspRes.data)) {
        ctsps = ctspRes.data;
      } else if (ctspRes && ctspRes.result && Array.isArray(ctspRes.result)) {
        ctsps = ctspRes.result;
      } else if (ctspRes && typeof ctspRes === "object" && !Array.isArray(ctspRes)) {
        ctsps = [ctspRes];
      }
      setVariants(ctsps);

      const dmList = Array.isArray(dmRes) ? dmRes : dmRes?.data ?? [];
      setDanhMucList(dmList);
      const dmMap = {};
      dmList.forEach((dm) => {
        const key = dm.madanhmuc ?? dm.maDanhMuc;
        dmMap[key] = dm.tendanhmuc ?? dm.tenDanhMuc;
      });
      setDanhMucMap(dmMap);

      const imgList = Array.isArray(imgRes) ? imgRes : imgRes?.data ?? [];
      setImages(imgList);
    } catch (e) {
      console.error("Lỗi load chi tiết sản phẩm:", e);
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Không tải được chi tiết sản phẩm.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  // ===== sync headerForm khi product thay đổi =====
  useEffect(() => {
    if (!product) return;
    setHeaderForm({
      tenSanPham: product.tenSanPham ?? product.tensanpham ?? "",
      maDanhMuc: product.maDanhMuc ?? product.madanhmuc ?? "",
      trangThai:
        typeof product.trangThai === "boolean"
          ? product.trangThai
          : String(product.trangThai).toLowerCase() !== "false",
      moTa: product.moTa ?? product.mota ?? "",
    });
  }, [product]);

  // ===== group ảnh theo mã chi tiết SP =====
  const imagesByVariant = useMemo(() => {
    if (!variants.length || !images.length) return new Map();
    const map = new Map();
    const variantIds = variants.map(
      (v) => v.maChiTietSanPham ?? v.machitietsanpham
    );

    images.forEach((img) => {
      const maCT = img.maChiTietSanPham ?? img.machitietsanpham;
      if (!maCT) return;
      const belongs = variantIds.some(
        (idCT) => Number(idCT) === Number(maCT)
      );
      if (!belongs) return;
      if (!map.has(maCT)) map.set(maCT, []);
      map.get(maCT).push(img);
    });

    return map;
  }, [variants, images]);

  // ===== upload ảnh lên Supabase =====
  const uploadImageToSupabase = async (file, productId, variantId = null) => {
    if (!supabase || !SUPABASE_BUCKET) {
      throw new Error(
        "Chưa cấu hình Supabase (URL, ANON_KEY hoặc BUCKET). Hãy kiểm tra file .env"
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const base = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const folder = variantId ? `variants/${variantId}` : "cover";
    const filePath = `${productId}/${folder}/${Date.now()}-${base}.${ext}`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, file);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(data.path);

    const publicUrl = publicUrlData?.publicUrl || "";
    return publicUrl;
  };

  // ===== lưu thông tin sản phẩm (header) =====
  const handleSaveHeader = async () => {
    if (!product) return;
    try {
      setSaving(true);

      const payload = {
        ...product,
        tenSanPham: headerForm.tenSanPham,
        maDanhMuc: Number(headerForm.maDanhMuc) || null,
        trangThai: headerForm.trangThai,
        moTa: headerForm.moTa,
      };

      const maSP = product.maSanPham ?? product.masanpham ?? id;
      await sanphamService.update(maSP, payload);
      await loadData();
      setEditingHeader(false);
      alert("Cập nhật thông tin sản phẩm thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin sản phẩm!");
    } finally {
      setSaving(false);
    }
  };

  // ===== mở / đóng modal biến thể =====
  const openVariantForm = (variant = null) => {
    if (variant) {
      const v = variant;
      setEditingVariant(v);
      setVariantForm({
        mauSac: v.mauSac ?? v.mausac ?? "",
        chatLieu: v.chatLieu ?? v.chatlieu ?? "",
        giaBan: Number(v.giaBan ?? v.giaban ?? 0),
        moTa: v.moTa ?? v.mota ?? "",
      });
      const sizeRows =
        Array.isArray(v.sizes) && v.sizes.length > 0
          ? v.sizes.map((sz, index) => ({
              tempId: `${index}-${Math.random()}`,
              maKichThuoc: String(sz.maKichThuoc ?? sz.makichthuoc ?? ""),
              soLuong: Number(sz.soLuong ?? sz.so_luong ?? 0),
            }))
          : [createEmptySizeRow()];
      setVariantSizes(sizeRows);
    } else {
      setEditingVariant(null);
      setVariantForm({
        mauSac: "",
        chatLieu: "",
        giaBan: 0,
        moTa: "",
      });
      setVariantSizes([createEmptySizeRow()]);
    }
    clearVariantFiles();
    setShowVariantForm(true);
  };

  const closeVariantForm = () => {
    setShowVariantForm(false);
    setEditingVariant(null);
    clearVariantFiles();
    setVariantSizes([createEmptySizeRow()]);
  };

  const handleVariantFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setVariantFiles((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    e.target.value = "";
  };

  const handleCoverFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !product) return;
    event.target.value = "";

    try {
      setCoverUploading(true);
      const maSP = product.maSanPham ?? product.masanpham ?? id;
      const publicUrl = await uploadImageToSupabase(file, maSP, null);
      await sanphamService.update(maSP, { hinhAnh: publicUrl });
      await loadData();
      alert("Đã cập nhật ảnh cover cho sản phẩm!");
    } catch (error) {
      console.error("Lỗi khi cập nhật ảnh cover:", error);
      alert("Không thể cập nhật ảnh cover. Vui lòng thử lại.");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!product) return;
    const currentCover = product.hinhAnh ?? product.hinhanh;
    if (!currentCover) return;
    if (!window.confirm("Bạn có chắc muốn gỡ ảnh cover hiện tại?")) return;

    try {
      setCoverUploading(true);
      const maSP = product.maSanPham ?? product.masanpham ?? id;
      await sanphamService.update(maSP, { hinhAnh: null });
      await loadData();
      alert("Đã gỡ ảnh cover.");
    } catch (error) {
      console.error("Lỗi khi gỡ ảnh cover:", error);
      alert("Không thể gỡ ảnh cover. Vui lòng thử lại.");
    } finally {
      setCoverUploading(false);
    }
  };

  // ===== lưu chi tiết sản phẩm + upload ảnh =====
  const handleSaveVariant = async (e) => {
  e.preventDefault();
  if (!product) return;

  if (!variantForm.mauSac) {
    alert("Please enter color!");
    return;
  }
  if (variantForm.giaBan < 0) {
    alert("Price cannot be negative!");
    return;
  }

  const sizePayload = variantSizes
    .filter((row) => row.maKichThuoc)
    .map((row) => ({
      maKichThuoc: Number(row.maKichThuoc),
      soLuong: Number(row.soLuong) || 0,
    }));

  if (!sizePayload.length) {
    alert("Please select at least one size and quantity.");
    return;
  }

  const invalidSizeQty = sizePayload.some((row) => row.soLuong < 0);
  if (invalidSizeQty) {
    alert("Size quantity cannot be negative!");
    return;
  }

  if (variantFiles.length === 0) {
    alert("Vui lòng chọn ít nhất một hình ảnh cho biến thể.");
    return;
  }

  setSaving(true);
  try {
    const maSP = product.maSanPham ?? product.masanpham ?? id;

    const totalStock = sizePayload.reduce(
      (sum, item) => sum + (item.soLuong || 0),
      0
    );
    const primarySizeName =
      sizeLabelMap.get(String(sizePayload[0].maKichThuoc)) ?? null;

    const payload = {
      maSanPham: Number(maSP),
      kichThuoc: primarySizeName,
      mauSac: variantForm.mauSac,
      chatLieu: variantForm.chatLieu,
      moTa: variantForm.moTa,
      giaBan: Number(variantForm.giaBan) || 0,
      soLuongTon: totalStock,
    };

    let savedVariant = null;

    if (editingVariant) {
      const maCT =
        editingVariant.maChiTietSanPham ?? editingVariant.machitietsanpham;
      savedVariant = await chitietsanphamService.update(maCT, payload);
    } else {
      savedVariant = await chitietsanphamService.create(payload);
    }

    const maCTSaved =
      savedVariant?.maChiTietSanPham ??
      savedVariant?.machitietsanpham ??
      savedVariant?.id ??
      savedVariant?.ID ??
      savedVariant?.data?.maChiTietSanPham ??
      savedVariant?.data?.machitietsanpham ??
      savedVariant?.data?.id ??
      editingVariant?.maChiTietSanPham ??
      editingVariant?.machitietsanpham;

    if (!maCTSaved && !editingVariant) {
      console.warn("Could not extract variant ID from response!", savedVariant);
    }

    if (maCTSaved) {
      await chitietsanphamService.saveSizes(maCTSaved, sizePayload);
    }

    if (maCTSaved && variantFiles.length > 0) {
      console.log(`Uploading ${variantFiles.length} images for variant ${maCTSaved}...`);
      for (const item of variantFiles) {
        const file = item.file;
        const publicUrl = await uploadImageToSupabase(
          file,
          maSP,
          maCTSaved
        );

        await hinhanhsanphamService.create({
          maChiTietSanPham: Number(maCTSaved),
          duongDanHinhAnh: publicUrl,
        });
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    const freshCtspRes = await chitietsanphamService.getByProductId(maSP);

    let freshCtsps = [];
    if (Array.isArray(freshCtspRes)) {
      freshCtsps = freshCtspRes;
    } else if (freshCtspRes && Array.isArray(freshCtspRes.data)) {
      freshCtsps = freshCtspRes.data;
    } else if (freshCtspRes && freshCtspRes.result && Array.isArray(freshCtspRes.result)) {
      freshCtsps = freshCtspRes.result;
    } else if (freshCtspRes && typeof freshCtspRes === "object" && !Array.isArray(freshCtspRes)) {
      freshCtsps = [freshCtspRes];
    }

    setVariants(freshCtsps);

    if (variantFiles.length > 0) {
      const freshImgRes = await hinhanhsanphamService.getAll();
      const freshImgList = Array.isArray(freshImgRes)
        ? freshImgRes
        : freshImgRes?.data ?? [];
      setImages(freshImgList);
    }

    closeVariantForm();

    alert(
      editingVariant
        ? "Variant updated successfully!"
        : "Variant created successfully!"
    );
  } catch (error) {
    console.error("Error when saving variant:", error);
    alert(
      "Failed to save variant: " +
        (error.message || "")
    );
  } finally {
    setSaving(false);
  }
};
;

  // ===== UI =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-700">
          Đang tải chi tiết sản phẩm…
        </div>
      </div>
    );
  }

  if (err || !product) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Quay lại
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {err || "Không tìm thấy sản phẩm."}
        </div>
      </div>
    );
  }

  const maSP = product.maSanPham ?? product.masanpham;
  const tenSP = product.tenSanPham ?? product.tensanpham;
  const maDM = product.maDanhMuc ?? product.madanhmuc;
  const trangThai = headerForm.trangThai;
  const tenDanhMuc = danhMucMap[maDM] ?? (maDM != null ? `#${maDM}` : "");
  const coverUrl = product?.hinhAnh ?? product?.hinhanh ?? "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Boxes className="text-blue-600" size={32} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {tenSP}
              </h1>
              </div>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>

      {/* Tong quan san pham + cover */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Tổng quan sản phẩm
            </p>
            <p className="text-sm font-semibold text-gray-900">{tenSP}</p>
          </div>
          <div className="flex items-center gap-2">
            {!editingHeader && (
              <button
                onClick={() => setEditingHeader(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-300 hover:text-blue-900"
              >
                <Edit2 size={16} />
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={() => setShowOverview((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-1.5 text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
              title={showOverview ? "Thu gon" : "Mo rong"}
            >
              <span className="sr-only">Dong/thu khung tong quan</span>
              {showOverview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {showOverview && (
          <div className="px-5 py-5 grid gap-5 xl:grid-cols-[minmax(0,2.5fr)_minmax(320px,1fr)] items-start">
            {/* Info column */}
            <div className="flex flex-col gap-4">
              {!editingHeader ? (
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Mã sản phẩm
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{maSP}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Danh mục 
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {tenDanhMuc || "Chua gan danh muc"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Trạng thái
                      </p>
                      <span
                        className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          trangThai
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {trangThai ? "Đang bán" : "Ngừng bán"}
                      </span>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Tên hiển thị
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{tenSP}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Mô tả
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-gray-800 leading-relaxed">
                      {headerForm.moTa || ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-sm shadow-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                        Tên sản phẩm
                      </label>
                      <input
                        type="text"
                        value={headerForm.tenSanPham}
                        onChange={(e) =>
                          setHeaderForm((f) => ({
                            ...f,
                            tenSanPham: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                        Danh mục
                      </label>
                      <select
                        value={headerForm.maDanhMuc}
                        onChange={(e) =>
                          setHeaderForm((f) => ({
                            ...f,
                            maDanhMuc: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {danhMucList.map((dm) => (
                          <option
                            key={dm.madanhmuc ?? dm.maDanhMuc}
                            value={dm.madanhmuc ?? dm.maDanhMuc}
                          >
                            {dm.tendanhmuc ?? dm.tenDanhMuc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                        Trạng thái
                      </label>
                      <select
                        value={String(headerForm.trangThai)}
                        onChange={(e) =>
                          setHeaderForm((f) => ({
                            ...f,
                            trangThai: e.target.value === "true",
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="true">Đang bán</option>
                        <option value="false">Ngừng bán</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                        Mô tả
                      </label>
                      <textarea
                        value={headerForm.moTa}
                        onChange={(e) =>
                          setHeaderForm((f) => ({ ...f, moTa: e.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingHeader(false);
                        setHeaderForm({
                          tenSanPham: product.tenSanPham ?? product.tensanpham ?? "",
                          maDanhMuc: product.maDanhMuc ?? product.madanhmuc ?? "",
                          trangThai:
                            typeof product.trangThai === "boolean"
                              ? product.trangThai
                              : String(product.trangThai).toLowerCase() !== "false",
                          moTa: product.moTa ?? product.mota ?? "",
                        });
                      }}
                      className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-white"
                    >
                      Huy
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveHeader}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {saving ? "Dang luu..." : "Luu thay doi"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cover column */}
            <div className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50 via-white to-white p-4 shadow-sm w-full max-w-xs justify-self-end">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Ảnh cover
                  </p>
              
                </div>
                {coverUrl && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    Cover
                  </span>
                )}
              </div>
              <div className="mt-2 rounded-xl border border-dashed border-blue-200 bg-white/70 p-2">
                <div className="aspect-[4/3] max-h-40 w-full overflow-hidden rounded-xl bg-gray-100">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Anh cover san pham"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      Chưa chọn ảnh cover
                    </div>
                  )}
                </div>
              </div>
          
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  disabled={coverUploading}
                >
                  {coverUploading ? "Đang tải..." : "Chọn ảnh"}
                </button>
                {coverUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-white disabled:opacity-50"
                    disabled={coverUploading}
                  >
                    Gỡ ảnh
                  </button>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileChange}
              />
            </div>
          </div>
        )}
      </div>
      {/* Biến thể sản phẩm */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Biến thể sản phẩm (size / màu) {variants.length > 0 && `(${variants.length})`}
          </h2>
          <button
            onClick={() => openVariantForm()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus size={16} />
            Thêm chi tiết sản phẩm
          </button>
        </div>

        {variants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Sản phẩm này chưa có biến thể nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Mã chi tiết
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Màu sắc
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Chất liệu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Giá bán
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Tồn kho
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Hình ảnh
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {variants.map((v, idx) => {
                  const maCT = v.maChiTietSanPham ?? v.machitietsanpham;
                  const size = v.kichThuoc ?? v.kichthuoc;
                  const sizeOptions = Array.isArray(v.sizes) ? v.sizes : [];
                  const color = v.mauSac ?? v.mausac;
                  const chatLieu = v.chatLieu ?? v.chatlieu;
                  const giaBan = v.giaBan ?? v.giaban;
                  const tonKho = v.soLuongTon ?? v.soluongton ?? 0;
                  const computedStock =
                    sizeOptions.length > 0
                      ? sizeOptions.reduce(
                          (sum, sz) => sum + (Number(sz.soLuong) || 0),
                          0
                        )
                      : tonKho;

                  const imgs = imagesByVariant.get(maCT) || [];
                  const thumbUrl =
                    imgs[0]?.duongDanHinhAnh ?? imgs[0]?.duongdanhinhanh;

                  return (
                    <tr key={maCT} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {maCT}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {sizeOptions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sizeOptions.map((sz) => (
                              <span
                                key={`${maCT}-${sz.id ?? sz.maKichThuoc ?? sz.tenKichThuoc}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-xs text-gray-700 bg-gray-50"
                              >
                                {sz.tenKichThuoc || size || ""}
                              </span>
                            ))}
                          </div>
                        ) : (
                          size || ""
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {color || ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {chatLieu || ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {fmtCurrency(giaBan)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {computedStock}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={`CTSP ${maCT}`}
                            className="h-14 w-14 object-cover inline-block rounded border"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Không có ảnh
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openVariantForm(v)}
                          className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          Sửa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal thêm / sửa chi tiết sản phẩm */}
      {showVariantForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingVariant
                  ? "Chỉnh sửa chi tiết sản phẩm"
                  : "Thêm chi tiết sản phẩm mới"}
              </h3>
              <button
                onClick={closeVariantForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveVariant}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Size áp dụng <span className="text-red-500">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddVariantSize}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Thêm size
                  </button>
                </div>

                <div className="space-y-3">
                  {variantSizes.map((row) => (
                    <div
                      key={row.tempId}
                      className="grid grid-cols-12 gap-3 items-end"
                    >
                      <div className="col-span-6">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Size
                        </label>
                        <select
                          value={row.maKichThuoc}
                          onChange={(e) =>
                            handleVariantSizeChange(
                              row.tempId,
                              "maKichThuoc",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">
                            {loadingSizes ? "Đang tải..." : "Chọn size"}
                          </option>
                          {sizeCatalog.map((size) => (
                            <option
                              key={size.maKichThuoc ?? size.makichthuoc}
                              value={String(size.maKichThuoc ?? size.makichthuoc)}
                            >
                              {size.tenKichThuoc ?? size.ten_kichthuoc}
                            </option>
                          ))}
                          {row.maKichThuoc &&
                            !sizeCatalog.some(
                              (s) =>
                                String(s.maKichThuoc ?? s.makichthuoc) ===
                                String(row.maKichThuoc)
                            ) && (
                              <option value={row.maKichThuoc}>
                                {row.maKichThuoc} (không có trong danh sách)
                              </option>
                            )}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tồn kho
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={row.soLuong}
                          onChange={(e) =>
                            handleVariantSizeChange(
                              row.tempId,
                              "soLuong",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2 flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantSize(row.tempId)}
                          className="text-sm text-red-500 hover:text-red-700"
                          disabled={variantSizes.length === 1}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {sizeErr && (
                  <p className="text-xs text-red-500">{sizeErr}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu sắc <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={variantForm.mauSac}
                    onChange={(e) =>
                      setVariantForm((f) => ({
                        ...f,
                        mauSac: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: Trắng, Đen, Xám..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chất liệu
                  </label>
                  <input
                    value={variantForm.chatLieu}
                    onChange={(e) =>
                      setVariantForm((f) => ({
                        ...f,
                        chatLieu: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: Cotton 100%..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá bán <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.giaBan}
                    onChange={(e) =>
                      setVariantForm((f) => ({
                        ...f,
                        giaBan: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả (cho biến thể này)
                </label>
                <textarea
                  value={variantForm.moTa}
                  onChange={(e) =>
                    setVariantForm((f) => ({ ...f, moTa: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* upload ảnh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh biến thể <span className="text-red-500">*</span>
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 cursor-pointer hover:border-blue-400 bg-white">
                  <span className="text-sm text-blue-600 font-medium">
                    Chọn ảnh 
                  </span>
                
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleVariantFilesChange}
                  />
                </label>
                {variantFiles.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {variantFiles.map((item) => (
                      <div key={item.id} className="relative">
                        <img
                          src={item.preview}
                          alt={item.file.name}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantFile(item.id)}
                          className="absolute top-1 right-1 bg-white/80 text-red-600 rounded-full p-1 shadow hover:bg-white"
                        >
                          <X size={14} />
                        </button>
                        <p className="mt-1 text-xs text-gray-600 line-clamp-2 text-center">
                          {item.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-red-500">
                    Chưa chọn ảnh nào cho biến thể này.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeVariantForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
