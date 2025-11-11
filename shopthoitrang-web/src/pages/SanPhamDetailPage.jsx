// src/pages/SanPhamDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Boxes, Edit2, Plus, Save, X } from "lucide-react";

import sanphamService from "../services/sanphamService";
import danhmucService from "../services/danhmucService";
import thuonghieuService from "../services/thuonghieuService";
import chitietsanphamService from "../services/chitietsanphamService";
import hinhanhsanphamService from "../services/hinhanhsanphamService";

// Supabase client
import { supabase } from "../utils/supabaseClient.js";

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
  const [thuongHieuList, setThuongHieuList] = useState([]);
  const [danhMucMap, setDanhMucMap] = useState({});
  const [thuongHieuMap, setThuongHieuMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ----- edit header (thông tin sản phẩm) -----
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    tenSanPham: "",
    maDanhMuc: "",
    maThuongHieu: "",
    trangThai: true,
    moTa: "",
  });

  // ----- modal thêm / sửa biến thể -----
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({
    kichThuoc: "",
    mauSac: "",
    chatLieu: "",
    giaBan: 0,
    soLuongTon: 0,
    moTa: "",
  });
  const [variantFiles, setVariantFiles] = useState([]); // File[]
  const [saving, setSaving] = useState(false);

  // ===== LOAD DATA CHÍNH =====
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setErr("");

    try {
      console.log("🔄 Loading data for product ID:", id);
      
      const [spRes, ctspRes, dmRes, thRes, imgRes] = await Promise.all([
        sanphamService.getById(id),
        chitietsanphamService.getByProductId(id),
        danhmucService.getAll(),
        thuonghieuService.getAll(),
        hinhanhsanphamService.getAll(),
      ]);

      console.log("📦 Raw ctspRes:", ctspRes);
      console.log("📦 Type of ctspRes:", typeof ctspRes);
      console.log("📦 Is Array:", Array.isArray(ctspRes));

      // ----- sản phẩm -----
      setProduct(spRes || null);

      // ----- chi tiết sản phẩm (biến thể) -----
      // FIX: Xử lý nhiều trường hợp cấu trúc dữ liệu
      let ctsps = [];
      if (Array.isArray(ctspRes)) {
        ctsps = ctspRes;
        console.log("✅ ctspRes is array, length:", ctsps.length);
      } else if (ctspRes && Array.isArray(ctspRes.data)) {
        ctsps = ctspRes.data;
        console.log("✅ ctspRes.data is array, length:", ctsps.length);
      } else if (ctspRes && ctspRes.result && Array.isArray(ctspRes.result)) {
        ctsps = ctspRes.result;
        console.log("✅ ctspRes.result is array, length:", ctsps.length);
      } else if (ctspRes && typeof ctspRes === 'object' && !Array.isArray(ctspRes)) {
        ctsps = [ctspRes];
        console.log("✅ ctspRes is single object, converted to array");
      }
      
      console.log("📦 Final variants array:", ctsps);
      console.log("📦 Variants count:", ctsps.length);
      
      setVariants(ctsps);

      // ----- danh mục -----
      const dmList = Array.isArray(dmRes) ? dmRes : dmRes?.data ?? [];
      setDanhMucList(dmList);
      const dmMap = {};
      dmList.forEach((dm) => {
        const key = dm.madanhmuc ?? dm.maDanhMuc;
        dmMap[key] = dm.tendanhmuc ?? dm.tenDanhMuc;
      });
      setDanhMucMap(dmMap);

      // ----- thương hiệu -----
      const thList = Array.isArray(thRes) ? thRes : thRes?.data ?? [];
      setThuongHieuList(thList);
      const thMap = {};
      thList.forEach((th) => {
        const key = th.mathuonghieu ?? th.maThuongHieu;
        thMap[key] = th.tenthuonghieu ?? th.tenThuongHieu;
      });
      setThuongHieuMap(thMap);

      // ----- hình ảnh -----
      const imgList = Array.isArray(imgRes) ? imgRes : imgRes?.data ?? [];
      setImages(imgList);
    } catch (e) {
      console.error("Lỗi load chi tiết sản phẩm:", e);
      setErr("Không tải được chi tiết sản phẩm.");
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
      maThuongHieu: product.maThuongHieu ?? product.mathuonghieu ?? "",
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
  const uploadImageToSupabase = async (file, productId, variantId) => {
    if (!supabase || !SUPABASE_BUCKET) {
      throw new Error(
        "Chưa cấu hình Supabase (URL, ANON_KEY hoặc BUCKET). Hãy kiểm tra file .env"
      );
    }

    const ext = file.name.split(".").pop();
    const fileName = `sp-${productId}-ctsp-${variantId}-${Date.now()}.${
      ext || "jpg"
    }`;
    const filePath = fileName;

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
        maThuongHieu: Number(headerForm.maThuongHieu) || null,
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
        kichThuoc: v.kichThuoc ?? v.kichthuoc ?? "",
        mauSac: v.mauSac ?? v.mausac ?? "",
        chatLieu: v.chatLieu ?? v.chatlieu ?? "",
        giaBan: Number(v.giaBan ?? v.giaban ?? 0),
        soLuongTon: Number(v.soLuongTon ?? v.soluongton ?? 0),
        moTa: v.moTa ?? v.mota ?? "",
      });
    } else {
      setEditingVariant(null);
      setVariantForm({
        kichThuoc: "",
        mauSac: "",
        chatLieu: "",
        giaBan: 0,
        soLuongTon: 0,
        moTa: "",
      });
    }
    setVariantFiles([]);
    setShowVariantForm(true);
  };

  const closeVariantForm = () => {
    setShowVariantForm(false);
    setEditingVariant(null);
    setVariantFiles([]);
  };

  const handleVariantFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setVariantFiles(files);
  };

  // ===== lưu chi tiết sản phẩm + upload ảnh =====
  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!product) return;

    if (!variantForm.kichThuoc) {
      alert("Vui lòng nhập size!");
      return;
    }
    if (!variantForm.mauSac) {
      alert("Vui lòng nhập màu sắc!");
      return;
    }
    if (variantForm.giaBan < 0) {
      alert("Giá bán không được âm!");
      return;
    }
    if (variantForm.soLuongTon < 0) {
      alert("Số lượng tồn không được âm!");
      return;
    }

    setSaving(true);
    try {
      const maSP = product.maSanPham ?? product.masanpham ?? id;
      console.log("💾 Saving variant for product:", maSP);

      const payload = {
        maSanPham: Number(maSP),
        kichThuoc: variantForm.kichThuoc,
        mauSac: variantForm.mauSac,
        chatLieu: variantForm.chatLieu,
        moTa: variantForm.moTa,
        giaBan: Number(variantForm.giaBan) || 0,
        soLuongTon: Number(variantForm.soLuongTon) || 0,
      };

      console.log("💾 Payload:", payload);

      let savedVariant = null;

      if (editingVariant) {
        const maCT =
          editingVariant.maChiTietSanPham ?? editingVariant.machitietsanpham;
        console.log("✏️ Updating variant:", maCT);
        savedVariant = await chitietsanphamService.update(maCT, payload);
        console.log("✅ Updated variant response:", savedVariant);
      } else {
        console.log("➕ Creating new variant");
        savedVariant = await chitietsanphamService.create(payload);
        console.log("✅ Created variant response:", savedVariant);
        console.log("✅ Response keys:", savedVariant ? Object.keys(savedVariant) : "null");
      }

      // Thử nhiều cách lấy ID
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

      console.log("📌 Extracted variant ID:", maCTSaved);
      
      if (!maCTSaved && !editingVariant) {
        console.warn("⚠️ Warning: Could not extract variant ID from response!");
        console.warn("⚠️ Full response:", JSON.stringify(savedVariant, null, 2));
      }

      // upload ảnh nếu có
      if (maCTSaved && variantFiles.length > 0) {
        console.log(`📸 Uploading ${variantFiles.length} images for variant ${maCTSaved}...`);
        for (const file of variantFiles) {
          const publicUrl = await uploadImageToSupabase(
            file,
            maSP,
            maCTSaved
          );

          const imgRow = await hinhanhsanphamService.create({
            maChiTietSanPham: Number(maCTSaved),
            duongDanHinhAnh: publicUrl,
          });

          console.log("✅ Image uploaded:", imgRow);
        }
      }

      // FIX: Đợi một chút để đảm bảo database đã commit
      console.log("⏳ Waiting for database to commit...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Reload trực tiếp chi tiết sản phẩm (không dùng loadData để tránh cache)
      console.log("🔄 Fetching fresh variants data...");
      const freshCtspRes = await chitietsanphamService.getByProductId(maSP);
      console.log("📦 Fresh ctspRes:", freshCtspRes);
      
      let freshCtsps = [];
      if (Array.isArray(freshCtspRes)) {
        freshCtsps = freshCtspRes;
      } else if (freshCtspRes && Array.isArray(freshCtspRes.data)) {
        freshCtsps = freshCtspRes.data;
      } else if (freshCtspRes && freshCtspRes.result && Array.isArray(freshCtspRes.result)) {
        freshCtsps = freshCtspRes.result;
      } else if (freshCtspRes && typeof freshCtspRes === 'object' && !Array.isArray(freshCtspRes)) {
        freshCtsps = [freshCtspRes];
      }
      
      console.log("📦 Fresh variants count:", freshCtsps.length);
      console.log("📦 Fresh variants:", freshCtsps);
      
      // Update state trực tiếp
      setVariants(freshCtsps);
      
      // Reload images nếu có upload ảnh
      if (variantFiles.length > 0) {
        const freshImgRes = await hinhanhsanphamService.getAll();
        const freshImgList = Array.isArray(freshImgRes) ? freshImgRes : freshImgRes?.data ?? [];
        setImages(freshImgList);
      }
      
      closeVariantForm();

      alert(
        editingVariant
          ? "Cập nhật chi tiết sản phẩm thành công!"
          : "Thêm chi tiết sản phẩm thành công!"
      );
    } catch (error) {
      console.error("❌ Lỗi khi lưu chi tiết sản phẩm:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
      alert(
        "Có lỗi xảy ra khi lưu chi tiết sản phẩm: " +
          (error.message || "")
      );
    } finally {
      setSaving(false);
    }
  };

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
  const maTH = product.maThuongHieu ?? product.mathuonghieu;
  const trangThai = headerForm.trangThai;
  const tenDanhMuc = danhMucMap[maDM] ?? (maDM != null ? `#${maDM}` : "—");
  const tenThuongHieu =
    thuongHieuMap[maTH] ?? (maTH != null ? `#${maTH}` : "—");

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

      {/* Thông tin sản phẩm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">
              Thông tin sản phẩm
            </h2>
            {!editingHeader && (
              <button
                onClick={() => setEditingHeader(true)}
                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm"
              >
                <Edit2 size={16} />
                Sửa
              </button>
            )}
          </div>

          {/* View mode */}
          {!editingHeader ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b">
                  <span className="font-medium">Mã sản phẩm:</span>
                  <span>{maSP}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="font-medium">Tên sản phẩm:</span>
                  <span>{tenSP}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="font-medium">Danh mục:</span>
                  <span>{tenDanhMuc}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="font-medium">Thương hiệu:</span>
                  <span>{tenThuongHieu}</span>
                </div>
                {/* Trạng thái */}
                <div className="flex justify-between py-1 border-b">
                  <span className="font-medium">Trạng thái:</span>
                  <span>{trangThai ? "Đang bán" : "Ngừng bán"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="py-1 border-b">
                  <span className="font-medium">Mô tả:</span>
                  <div className="mt-1 text-gray-700">
                    {headerForm.moTa || (
                      <span className="text-gray-400">Không có</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit mode
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Tên sản phẩm
                </label>
                <input
                  value={headerForm.tenSanPham}
                  onChange={(e) =>
                    setHeaderForm((f) => ({
                      ...f,
                      tenSanPham: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-gray-700 font-medium mb-1">
                    Thương hiệu
                  </label>
                  <select
                    value={headerForm.maThuongHieu}
                    onChange={(e) =>
                      setHeaderForm((f) => ({
                        ...f,
                        maThuongHieu: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn thương hiệu --</option>
                    {thuongHieuList.map((th) => (
                      <option
                        key={th.mathuonghieu ?? th.maThuongHieu}
                        value={th.mathuonghieu ?? th.maThuongHieu}
                      >
                        {th.tenthuonghieu ?? th.tenThuongHieu}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Đang bán</option>
                    <option value="false">Ngừng bán</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Mô tả
                </label>
                <textarea
                  value={headerForm.moTa}
                  onChange={(e) =>
                    setHeaderForm((f) => ({ ...f, moTa: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingHeader(false);
                    // reset về product gốc
                    setHeaderForm({
                      tenSanPham: product.tenSanPham ?? product.tensanpham ?? "",
                      maDanhMuc: product.maDanhMuc ?? product.madanhmuc ?? "",
                      maThuongHieu:
                        product.maThuongHieu ?? product.mathuonghieu ?? "",
                      trangThai:
                        typeof product.trangThai === "boolean"
                          ? product.trangThai
                          : String(product.trangThai).toLowerCase() !==
                            "false",
                      moTa: product.moTa ?? product.mota ?? "",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveHeader}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          )}
        </div>
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
                  const color = v.mauSac ?? v.mausac;
                  const chatLieu = v.chatLieu ?? v.chatlieu;
                  const giaBan = v.giaBan ?? v.giaban;
                  const tonKho = v.soLuongTon ?? v.soluongton ?? 0;

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
                        {size || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {color || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {chatLieu || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {fmtCurrency(giaBan)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {tonKho}
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
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

            <form onSubmit={handleSaveVariant} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={variantForm.kichThuoc}
                    onChange={(e) =>
                      setVariantForm((f) => ({
                        ...f,
                        kichThuoc: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VD: S, M, L, XL..."
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
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
                  />
                </div>
                <div className="col-span-1">
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
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng tồn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.soLuongTon}
                    onChange={(e) =>
                      setVariantForm((f) => ({
                        ...f,
                        soLuongTon: Number(e.target.value),
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
                  Hình ảnh (upload từ máy)
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 cursor-pointer hover:border-blue-400">
                  <span className="text-sm text-blue-600 font-medium">
                    Chọn ảnh từ máy (có thể chọn nhiều)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleVariantFilesChange}
                  />
                </label>
                {variantFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {variantFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="w-16 h-16 border rounded overflow-hidden text-[10px] flex items-center justify-center bg-gray-50 px-1 text-center"
                      >
                        <span className="line-clamp-2">{f.name}</span>
                      </div>
                    ))}
                  </div>
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