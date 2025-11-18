// src/pages/ChiTietPhieuDatHangPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import phieuDatHangService from "../services/phieuDatHangService";
import chitietphieudathangService from "../services/chitietphieudathangService";
import sanphamService from "../services/sanphamService";
import chitietsanphamService from "../services/chitietsanphamService";
import nhacungcapService from "../services/nhacungcapService";
import nhanvienService from "../services/nhanvienService";
import { useAuth } from "../contexts/AuthContext";

const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "");

// Chuẩn hoá trạng thái: bỏ dấu, thường hoá
const normalizeStatus = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const normalizeSizeLabel = (value) =>
  value?.toString().trim().toLowerCase() ?? "";

const extractVariantSizeNames = (detail = {}) => {
  const source =
    Array.isArray(detail?.sizes) && detail.sizes.length
      ? detail.sizes
      : Array.isArray(detail?.chitietsanpham_kichthuoc)
      ? detail.chitietsanpham_kichthuoc
      : [];

  const map = new Map();
  const pushLabel = (label) => {
    const normalized = normalizeSizeLabel(label);
    if (!normalized) return;
    if (!map.has(normalized)) {
      map.set(normalized, label);
    }
  };

  source.forEach((size) => {
    pushLabel(
      size?.tenKichThuoc ??
        size?.ten_kichthuoc ??
        size?.kichthuocs?.ten_kichthuoc ??
        size?.kichthuocs?.tenKichThuoc ??
        ""
    );
  });

  pushLabel(detail?.kichThuoc ?? detail?.kichthuoc ?? null);

  return Array.from(map.values());
};

const variantMatchesSize = (detail, targetSize) => {
  if (!targetSize) return true;
  const normalized = normalizeSizeLabel(targetSize);
  return extractVariantSizeNames(detail).some(
    (label) => normalizeSizeLabel(label) === normalized
  );
};

const resolveSizeLabel = (row, detail) => {
  const rowSize = row?.kichThuoc ?? row?.kichthuoc;
  if (rowSize) return rowSize;
  const sizes = extractVariantSizeNames(detail);
  return sizes[0] ?? "";
};

export default function ChiTietPhieuDatHangPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phieu, setPhieu] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDetails, setProductDetails] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Helper function to get supplier name
  const getTenNhaCungCap = (maNCC) => {
    if (!maNCC) return "";
    const found = suppliers.find(
      (s) =>
        s.maNhaCungCap === maNCC ||
        s.manhacungcap === maNCC ||
        Number(s.maNhaCungCap ?? s.manhacungcap) === Number(maNCC)
    );
    return found?.tenNhaCungCap ?? found?.tennhacungcap ?? `#${maNCC}`;
  };

  // Helper function to get employee name
  const getTenNhanVien = (maNhanVien) => {
    if (!maNhanVien) return "";
    const found = employees.find(
      (e) =>
        e.maNhanVien === maNhanVien ||
        e.manhanvien === maNhanVien ||
        Number(e.maNhanVien ?? e.manhanvien) === Number(maNhanVien)
    );
    return found?.hoTen ?? found?.hoten ?? `#${maNhanVien}`;
  };

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [subErr, setSubErr] = useState("");

  // form thêm/sửa chi tiết
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    maSanPham: "",
    kichThuoc: "",
    mauSac: "",
    soLuong: 1,
    donGia: 0,
    ghiChu: "",
    chatLieu: "",
  });
  const [saving, setSaving] = useState(false);

  // State edit inline phần header (thông tin + thanh toán)
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    ngayHenDuKien: "",
    tienCoc: 0,
    phuongThucThanhToan: "",
    ghiChu: "",
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setErr("");
    setSubErr("");

    const idNum = Number(id);

    try {
      const [phieuRes, suppliersData, employeesData] = await Promise.all([
        phieuDatHangService.getById(id),
        nhacungcapService.getAll(),
        nhanvienService.getAll(),
      ]);

      setPhieu(phieuRes || null);
      setSuppliers(
        Array.isArray(suppliersData) ? suppliersData : suppliersData?.data || []
      );
      setEmployees(
        Array.isArray(employeesData) ? employeesData : employeesData?.data || []
      );
    } catch (e) {
      console.error("Lỗi load dữ liệu:", e);
      setErr("Không tải được dữ liệu phiếu đặt hàng.");
      setLoading(false);
      return;
    }

    try {
      const [detailRes, productRes, productDetailRes] = await Promise.allSettled([
        chitietphieudathangService.getByPhieu(id),
        sanphamService.getAll(),
        chitietsanphamService.getAll(),
      ]);

      // ===== Chi tiết phiếu =====
      if (detailRes.status === "fulfilled") {
        const data = detailRes.value;
        let itemsData = [];
        if (Array.isArray(data)) itemsData = data;
        else if (data && Array.isArray(data.data)) itemsData = data.data;
        else if (data && typeof data === "object") itemsData = Object.values(data);

        itemsData = itemsData.filter(
          (it) => Number(it.maPhieuDatHang ?? it.maphieudathang) === idNum
        );

        setItems(itemsData);
      } else {
        console.error("Lỗi load chi tiết phiếu:", detailRes.reason);
        setSubErr("Không thể tải danh sách chi tiết phiếu đặt hàng.");
        setItems([]);
      }

      // ===== Sản phẩm =====
      if (productRes.status === "fulfilled") {
        const prodData = productRes.value;
        const prods = Array.isArray(prodData)
          ? prodData
          : Array.isArray(prodData?.data)
          ? prodData.data
          : [];
        setProducts(prods);
      }

      // ===== Chi tiết sản phẩm =====
      if (productDetailRes.status === "fulfilled") {
        const pdData = productDetailRes.value;
        const pds = Array.isArray(pdData)
          ? pdData
          : Array.isArray(pdData?.data)
          ? pdData.data
          : [];
        setProductDetails(pds);
      } else {
        console.error("Lỗi load chi tiết sản phẩm:", productDetailRes.reason);
        setProductDetails([]);
      }
    } catch (e) {
      console.error("Lỗi bất ngờ:", e);
      if (!subErr) setSubErr("Có lỗi khi tải dữ liệu chi tiết.");
    } finally {
      setLoading(false);
    }
  };

  // đồng bộ form header khi phieu thay đổi
  useEffect(() => {
    if (phieu) {
      setHeaderForm({
        ngayHenDuKien:
          (phieu.ngayHenDuKien ?? phieu.ngayhendukien ?? "")
            .toString()
            .split("T")[0] || "",
        tienCoc: Number(phieu.tienCoc ?? phieu.tiencoc ?? 0),
        phuongThucThanhToan:
          phieu.phuongThucThanhToan ?? phieu.phuongthucthanhtoan ?? "",
        ghiChu: phieu.ghiChu ?? phieu.ghichu ?? "",
      });
    }
  }, [phieu]);

  // ===== Lấy tên SP + size, màu cho từng dòng =====
  const getProductInfoFromRow = (row) => {
    const maCT = row.maChiTietSanPham ?? row.machitietsanpham ?? null;
    const maSPFromRow = row.maSanPham ?? row.masanpham ?? null;

    let chiTiet = null;
    let maSP = maSPFromRow;

    if (maCT != null) {
      chiTiet = productDetails.find(
        (pd) => Number(pd.maChiTietSanPham ?? pd.machitietsanpham) === Number(maCT)
      );
      if (chiTiet) {
        maSP = chiTiet.maSanPham ?? chiTiet.masanpham ?? maSP;
      }
    }

    let sanPham = null;
    if (maSP != null) {
      sanPham = products.find(
        (p) => Number(p.maSanPham ?? p.masanpham) === Number(maSP)
      );
    }

    const tenSP =
      sanPham?.tenSanPham ??
      sanPham?.tensanpham ??
      (maSP != null ? `SP#${maSP}` : maCT != null ? `#${maCT}` : "");

    const kichThuoc = resolveSizeLabel(row, chiTiet);
    const mauSacRow = row.mauSac ?? row.mausac;

    const mauSac =
      mauSacRow ??
      chiTiet?.mauSac ??
      chiTiet?.mausac ??
      null;

    const chatLieu =
      row.chatLieu ??
      row.chatlieu ??
      chiTiet?.chatLieu ??
      chiTiet?.chatlieu ??
      "";

    return { tenSanPham: tenSP, kichThuoc, mauSac, chatLieu };
  };

  const summary = useMemo(() => {
    let tongSoLuong = 0;
    let tongThanhTien = 0;
    for (const it of items) {
      const sl = Number(it.soLuong ?? it.soluong ?? 0);
      const tt = Number(it.thanhTien ?? it.thanhtien ?? 0);
      tongSoLuong += sl;
      tongThanhTien += tt;
    }
    return { tongSoLuong, tongThanhTien };
  }, [items]);

  // Khi tổng thành tiền thay đổi thì cập nhật Tổng tiền của phiếu đặt hàng
  useEffect(() => {
    if (!phieu) return;

    const maPhieu = phieu.maPhieuDatHang ?? phieu.maphieudathang ?? id;
    if (!maPhieu) return;

    const currentTong = Number(phieu.tongTien ?? phieu.tongtien ?? 0);
    const newTong = Number(summary.tongThanhTien || 0);

    if (!Number.isFinite(newTong) || currentTong === newTong) return;

    const updateTongTien = async () => {
      try {
        // Tính lại tiền còn lại = tổng - cọc (không âm)
        const deposit = Number(phieu.tienCoc ?? phieu.tiencoc ?? 0);
        const newConLai = Math.max(0, newTong - deposit);

        await phieuDatHangService.update(maPhieu, {
          ...phieu,
          tongTien: newTong,
          tongtien: newTong,
          conLai: newConLai,
          conlai: newConLai,
        });

        setPhieu((prev) =>
          prev
            ? {
                ...prev,
                tongTien: newTong,
                tongtien: newTong,
                conLai: newConLai,
                conlai: newConLai,
              }
            : prev
        );
      } catch (e) {
        console.error("Lỗi cập nhật tổng tiền phiếu:", e);
      }
    };

    updateTongTien();
  }, [summary.tongThanhTien, phieu, id]);

  // ========== Form thêm / sửa chi tiết ==========

  const sizeOptions = useMemo(() => {
    if (!formData.maSanPham) return [];
    const map = new Map();
    productDetails
      .filter(
        (pd) =>
          Number(pd.maSanPham ?? pd.masanpham) ===
          Number(formData.maSanPham)
      )
      .forEach((pd) => {
        extractVariantSizeNames(pd).forEach((label) => {
          const key = normalizeSizeLabel(label);
          if (key && !map.has(key)) {
            map.set(key, label);
          }
        });
      });
    return Array.from(map.values());
  }, [formData.maSanPham, productDetails]);

const colorOptions = useMemo(() => {
  if (!formData.maSanPham) return [];
  const colors = productDetails
    .filter(
      (pd) =>
        Number(pd.maSanPham ?? pd.masanpham) ===
        Number(formData.maSanPham) &&
        variantMatchesSize(pd, formData.kichThuoc)
    )
    .map((pd) => pd.mauSac ?? pd.mausac)
    .filter(Boolean);
  return Array.from(new Set(colors));
}, [formData.maSanPham, formData.kichThuoc, productDetails]);

  const chatLieuOptions = useMemo(() => {
    if (!formData.maSanPham) return [];
    const materials = productDetails
      .filter((pd) => {
        const maSP = pd.maSanPham ?? pd.masanpham;
        if (Number(maSP) !== Number(formData.maSanPham)) return false;
        if (!variantMatchesSize(pd, formData.kichThuoc)) return false;
        const color = pd.mauSac ?? pd.mausac;
        if (formData.mauSac && color !== formData.mauSac) return false;
        return true;
      })
      .map((pd) => pd.chatLieu ?? pd.chatlieu)
      .filter(Boolean);
    return Array.from(new Set(materials));
  }, [productDetails, formData.maSanPham, formData.kichThuoc, formData.mauSac]);

  useEffect(() => {
    if (
      formData.chatLieu &&
      chatLieuOptions.length &&
      !chatLieuOptions.includes(formData.chatLieu)
    ) {
      setFormData((prev) => ({ ...prev, chatLieu: "" }));
    }
  }, [chatLieuOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenForm = (item = null) => {
    if (!canEdit) return; // an toàn thêm: nếu không được sửa thì bỏ qua

    if (item) {
      setEditingItem(item);
      const maChiTiet = item.maChiTietSanPham ?? item.machitietsanpham;

      const chiTiet = productDetails.find(
        (pd) =>
          Number(pd.maChiTietSanPham ?? pd.machitietsanpham) === Number(maChiTiet)
      );

      const maSP = chiTiet?.maSanPham ?? chiTiet?.masanpham;

      setFormData({
        maSanPham: maSP ? String(maSP) : "",
        kichThuoc: resolveSizeLabel(item, chiTiet),
        mauSac:
          item.mauSac ??
          item.mausac ??
          chiTiet?.mauSac ??
          chiTiet?.mausac ??
          "",
        soLuong: Number(item.soLuong ?? item.soluong ?? 1),
        donGia: Number(item.donGia ?? item.dongia ?? 0),
        ghiChu: item.ghiChu ?? item.ghichu ?? "",
        chatLieu:
          item.chatLieu ??
          item.chatlieu ??
          chiTiet?.chatLieu ??
          chiTiet?.chatlieu ??
          "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        maSanPham: "",
        kichThuoc: "",
        mauSac: "",
        soLuong: 1,
        donGia: 0,
        ghiChu: "",
        chatLieu: "",
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      maSanPham: "",
      kichThuoc: "",
      mauSac: "",
      soLuong: 1,
      donGia: 0,
      ghiChu: "",
      chatLieu: "",
    });
  };

  // Khi đổi sản phẩm => reset size & màu, options sẽ tự lọc lại
  const handleProductChange = (maSanPham) => {
    setFormData((prev) => ({
      ...prev,
      maSanPham,
      kichThuoc: "",
      mauSac: "",
      chatLieu: "",
    }));
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!canEdit) return; // không cho lưu khi không được sửa

    if (!formData.maSanPham) {
      alert("Vui lòng chọn sản phẩm!");
      return;
    }
    if (!formData.soLuong || formData.soLuong <= 0) {
      alert("Số lượng phải lớn hơn 0!");
      return;
    }
    if (formData.donGia < 0) {
      alert("Đơn giá không được âm!");
      return;
    }

    // Tìm đúng ChiTietSanPham theo SP + size + màu
    const chiTiet = productDetails.find((pd) => {
      const maSP = pd.maSanPham ?? pd.masanpham;
      const mau = pd.mauSac ?? pd.mausac;
      return (
        Number(maSP) === Number(formData.maSanPham) &&
        variantMatchesSize(pd, formData.kichThuoc) &&
        (!formData.mauSac || mau === formData.mauSac)
      );
    });

    if (!chiTiet) {
      alert(
        "Không tìm thấy chi tiết sản phẩm phù hợp với sản phẩm / size / màu bạn chọn.\nVui lòng kiểm tra lại cấu hình chi tiết sản phẩm."
      );
      return;
    }

    const maChiTietSanPham =
      chiTiet.maChiTietSanPham ?? chiTiet.machitietsanpham;

    setSaving(true);
    try {
      const thanhTien = Number(formData.soLuong) * Number(formData.donGia);
      const chatLieuValue =
        formData.chatLieu ||
        chiTiet.chatLieu ||
        chiTiet.chatlieu ||
        "";

      const payload = {
        maPhieuDatHang: Number(id),
        maChiTietSanPham: Number(maChiTietSanPham),
        soLuong: Number(formData.soLuong),
        donGia: Number(formData.donGia),
        thanhTien,
        ghiChu: formData.ghiChu || "",
        kichThuoc: formData.kichThuoc || "",
        mauSac: formData.mauSac || "",
        chatLieu: chatLieuValue,
      };

      if (editingItem) {
        const maChiTiet =
          editingItem.maChiTietPhieuDatHang ??
          editingItem.machitietphieudathang;
        await chitietphieudathangService.update(maChiTiet, payload);
      } else {
        await chitietphieudathangService.create(payload);
      }

      await loadData();
      handleCloseForm();
      alert(
        editingItem
          ? "Cập nhật chi tiết thành công!"
          : "Thêm chi tiết thành công!"
      );
    } catch (error) {
      console.error("Lỗi khi lưu chi tiết:", error);
      const errorMsg =
        error.response?.data?.message || error.message || "Có lỗi xảy ra";
      alert(
        `Có lỗi xảy ra khi lưu chi tiết phiếu đặt hàng!\n\nChi tiết: ${errorMsg}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!canEdit) return; // không cho xoá khi không được sửa
    if (!window.confirm("Bạn có chắc chắn muốn xóa dòng chi tiết này?")) return;
    try {
      const maChiTiet =
        item.maChiTietPhieuDatHang ?? item.machitietphieudathang;
      await chitietphieudathangService.delete(maChiTiet);
      await loadData();
    } catch (error) {
      console.error("Lỗi khi xóa chi tiết:", error);
      alert("Có lỗi xảy ra khi xóa chi tiết!");
    }
  };

  // Lưu thông tin header inline
  const handleSaveHeader = async () => {
    if (!canEdit) return;

    try {
      setSaving(true);
      // Tính lại tiền còn lại dựa trên tổng hiện tại và tiền cọc mới
      const tong = Number(phieu.tongTien ?? phieu.tongtien ?? summary.tongThanhTien ?? 0);
      const deposit = Number(headerForm.tienCoc) || 0;
      const conLaiNew = Math.max(0, tong - deposit);
      const payload = {
        ...phieu,
        ngayHenDuKien: headerForm.ngayHenDuKien || null,
        tienCoc: Number(headerForm.tienCoc) || 0,
        phuongThucThanhToan: headerForm.phuongThucThanhToan || null,
        ghiChu: headerForm.ghiChu || null,
        // đồng bộ các khóa kiểu snake_case
        tongTien: tong,
        tongtien: tong,
        conLai: conLaiNew,
        conlai: conLaiNew,
      };

      const maPhieu = phieu?.maPhieuDatHang ?? phieu?.maphieudathang ?? id;

      await phieuDatHangService.update(maPhieu, payload);
      await loadData();
      setEditingHeader(false);
      alert("Cập nhật thông tin phiếu thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin phiếu!");
    } finally {
      setSaving(false);
    }
  };

  // ====== GỬI / DUYỆT / HỦY PHIẾU ======

  const handleSendOrder = async () => {
    if (!phieu) return;
    if (
      !window.confirm(
        "Bạn chắc chắn muốn gửi phiếu đặt hàng này cho quản lý xác nhận?\nSau khi gửi, bạn sẽ không thể chỉnh sửa phiếu."
      )
    )
      return;
    try {
      setSaving(true);
      const maPhieu = phieu.maPhieuDatHang ?? phieu.maphieudathang ?? id;

      await phieuDatHangService.update(maPhieu, {
        ...phieu,
        trangThaiPhieu: "Chờ xác nhận",
        trangthaiphieu: "Chờ xác nhận",
      });

      await loadData();
      alert("Đã gửi phiếu đặt hàng cho quản lý xác nhận.");
      // TODO: tích hợp hệ thống thông báo cho quản lý (qua bell ở header)
    } catch (error) {
      console.error("Lỗi khi gửi phiếu:", error);
      alert("Có lỗi xảy ra khi gửi phiếu đặt hàng!");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveOrder = async () => {
    if (!phieu) return;
    if (!window.confirm("Bạn có chắc chắn muốn duyệt phiếu đặt hàng này?"))
      return;

    try {
      setSaving(true);
      const maPhieu = phieu.maPhieuDatHang ?? phieu.maphieudathang ?? id;

      await phieuDatHangService.update(maPhieu, {
        ...phieu,
        trangThaiPhieu: "Đã duyệt",
        trangthaiphieu: "Đã duyệt",
      });

      await loadData();
      alert("Đã duyệt phiếu đặt hàng.");
      // TODO: gửi thông báo cho nhân viên tạo phiếu
    } catch (error) {
      console.error("Lỗi khi duyệt phiếu:", error);
      alert("Có lỗi xảy ra khi duyệt phiếu đặt hàng!");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!phieu) return;
    const reason = window.prompt("Nhập lý do hủy phiếu đặt hàng:");
    if (reason === null) return; // user bấm Cancel
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do hủy.");
      return;
    }

    try {
      setSaving(true);
      const maPhieu = phieu.maPhieuDatHang ?? phieu.maphieudathang ?? id;

      await phieuDatHangService.update(maPhieu, {
        ...phieu,
        trangThaiPhieu: "Đã hủy",
        trangthaiphieu: "Đã hủy",
        // Nếu DB có cột lý do hủy thì gửi thêm:
        // lyDoHuy: reason,
        // lydohuy: reason,
      });

      await loadData();
      alert(`Đã hủy phiếu đặt hàng.\nLý do: ${reason}`);
      // TODO: gửi thông báo cho nhân viên tạo phiếu kèm lý do hủy
    } catch (error) {
      console.error("Lỗi khi hủy phiếu:", error);
      alert("Có lỗi xảy ra khi hủy phiếu đặt hàng!");
    } finally {
      setSaving(false);
    }
  };

  // ========== UI ==========

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-700">
          Đang tải chi tiết phiếu đặt hàng…
        </div>
      </div>
    );
  }

  if (err || !phieu) {
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
          {err || "Không tìm thấy phiếu đặt hàng."}
        </div>
      </div>
    );
  }

  const maPhieu = phieu.maPhieuDatHang ?? phieu.maphieudathang;
  const tenNCC = getTenNhaCungCap(phieu.maNhaCungCap ?? phieu.manhacungcap);
  const tenNV = getTenNhanVien(phieu.maNhanVien ?? phieu.manhanvien);
  const ngayDat = phieu.ngayDatPhieu ?? phieu.ngaydatphieu;
  const ngayHen = phieu.ngayHenDuKien ?? phieu.ngayhendukien;
  const tongTien = phieu.tongTien ?? phieu.tongtien;
  const tienCoc = phieu.tienCoc ?? phieu.tiencoc;
  // Hiển thị còn lại theo giá trị đang chỉnh nếu đang edit, ngược lại lấy từ phiếu
  const conLaiDisplay = Math.max(
    0,
    Number(tongTien || 0) - Number((editingHeader ? headerForm.tienCoc : tienCoc) || 0)
  );
  const trangThai = phieu.trangThaiPhieu ?? phieu.trangthaiphieu;
  const ghiChu = phieu.ghiChu ?? phieu.ghichu;
  const ptThanhToan = phieu.phuongThucThanhToan ?? phieu.phuongthucthanhtoan;

  const normalizedStatus = normalizeStatus(trangThai);
  const role = user?.maQuyen;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

  // chỉ được sửa khi phiếu đang "Tạo mới"
  const canEdit = normalizedStatus === "tao moi";
  // nút GỬI: mọi vai trò, chỉ khi "Tạo mới"
  const canSend = normalizedStatus === "tao moi";
  // nút DUYỆT / HỦY: chỉ ADMIN + MANAGER, khi "Chờ xác nhận"
  const canApprove = (isAdmin || isManager) && normalizedStatus === "cho xac nhan";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <FileText className="text-blue-600" size={32} />
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Phiếu đặt hàng {maPhieu}
              </h1>
              <span
                className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                  trangThai?.toLowerCase().includes("hủy")
                    ? "bg-red-100 text-red-700"
                    : trangThai?.toLowerCase().includes("hoàn")
                    ? "bg-purple-100 text-purple-700"
                    : trangThai?.toLowerCase().includes("duyệt")
                    ? "bg-green-100 text-green-700"
                    : trangThai?.toLowerCase().includes("chờ")
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {trangThai || ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <button
              onClick={handleSendOrder}
              disabled={saving}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-500 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              <Send size={16} />
              Gửi
            </button>
          )}

          {canApprove && (
            <>
              <button
                onClick={handleApproveOrder}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-600 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                Duyệt
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-600 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle size={16} />
                Hủy
              </button>
            </>
          )}

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
        </div>
      </div>

      {subErr && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          {subErr}
        </div>
      )}

      {/* Thông tin + Thanh toán + Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gộp Thông tin + Thanh toán */}
        <div className="bg-white border rounded-xl p-4 md:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">
              Thông tin & thanh toán
            </h2>

            {canEdit && !editingHeader && (
              <button
                onClick={() => setEditingHeader(true)}
                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm"
              >
                <Edit2 size={16} />
                <span>Sửa</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            {/* Cột trái */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">Nhà cung cấp:</span>
                <span>{tenNCC || ""}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">Nhân viên:</span>
                <span>{tenNV || ""}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">Ngày đặt:</span>
                <span>{fmtDate(ngayDat)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">Ngày hẹn:</span>
                {editingHeader ? (
                  <input
                    type="date"
                    value={headerForm.ngayHenDuKien}
                    onChange={(e) =>
                      setHeaderForm((f) => ({
                        ...f,
                        ngayHenDuKien: e.target.value,
                      }))
                    }
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <span>{fmtDate(ngayHen)}</span>
                )}
              </div>
            </div>

            {/* Cột phải */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">Tiền cọc:</span>
                {editingHeader ? (
                  <input
                    type="number"
                    min="0"
                    value={headerForm.tienCoc}
                    onChange={(e) =>
                      setHeaderForm((f) => ({
                        ...f,
                        tienCoc: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <span>{fmtCurrency(tienCoc)}</span>
                )}
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">Còn lại:</span>
                <span>{fmtCurrency(conLaiDisplay)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">PT thanh toán:</span>
                {editingHeader ? (
                  <select
                    value={headerForm.phuongThucThanhToan}
                    onChange={(e) =>
                      setHeaderForm((f) => ({
                        ...f,
                        phuongThucThanhToan: e.target.value,
                      }))
                    }
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn phương thức --</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Thẻ tín dụng">Thẻ tín dụng</option>
                  </select>
                ) : (
                  <span>{ptThanhToan || ""}</span>
                )}
              </div>
              <div className="py-1 border-b">
                <span className="font-medium">Ghi chú:</span>
                {editingHeader ? (
                  <textarea
                    value={headerForm.ghiChu}
                    onChange={(e) =>
                      setHeaderForm((f) => ({ ...f, ghiChu: e.target.value }))
                    }
                    rows={2}
                    className="mt-1 w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="mt-1 text-gray-700">
                    {ghiChu || <span className="text-gray-400">Không có</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {editingHeader && (
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setHeaderForm({
                    ngayHenDuKien:
                      (phieu.ngayHenDuKien ?? phieu.ngayhendukien ?? "")
                        .toString()
                        .split("T")[0] || "",
                    tienCoc: Number(phieu.tienCoc ?? phieu.tiencoc ?? 0),
                    phuongThucThanhToan:
                      phieu.phuongThucThanhToan ??
                      phieu.phuongthucthanhtoan ??
                      "",
                    ghiChu: phieu.ghiChu ?? phieu.ghichu ?? "",
                  });
                  setEditingHeader(false);
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
          )}
        </div>

        {/* Thống kê */}
        <div className="bg-white border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Thống kê
          </h2>
          <div className="space-y-1 text-sm text-gray-700">
            <div>
              <span className="font-medium">Số mặt hàng: </span>
              {items.length}
            </div>
            <div>
              <span className="font-medium">Tổng số lượng: </span>
              {summary.tongSoLuong}
            </div>
            <div>
              <span className="font-medium">Tổng thành tiền: </span>
              {fmtCurrency(summary.tongThanhTien)}
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết phiếu */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Chi tiết phiếu đặt hàng
          </h2>
          {canEdit && (
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              Thêm chi tiết
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Phiếu này chưa có dòng chi tiết nào.
            {canEdit && (
              <div className="mt-2">
                <button
                  onClick={() => handleOpenForm()}
                  className="text-blue-600 hover:underline"
                >
                  Thêm chi tiết đầu tiên
                </button>
              </div>
            )}
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
                    Tên sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Kích thước
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Chất liệu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Màu sắc
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Thành tiền
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Ghi chú
                  </th>
                  {canEdit && (
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((it, idx) => {
                  const { tenSanPham, kichThuoc, mauSac, chatLieu } =
                    getProductInfoFromRow(it);

                  const soLuong = Number(it.soLuong ?? it.soluong ?? 0);
                  const donGia = Number(it.donGia ?? it.dongia ?? 0);
                  const thanhTien =
                    Number(it.thanhTien ?? it.thanhtien) || soLuong * donGia;

                  return (
                    <tr
                      key={
                        it.maChiTietPhieuDatHang ?? it.machitietphieudathang
                      }
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {tenSanPham}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {kichThuoc ?? ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {chatLieu || ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {mauSac ?? ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {soLuong}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {fmtCurrency(donGia)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {fmtCurrency(thanhTien)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {it.ghiChu ?? it.ghichu ?? ""}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenForm(it)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Sửa"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(it)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal form thêm / sửa chi tiết */}
      {showForm && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? "Chỉnh sửa chi tiết" : "Thêm chi tiết mới"}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sản phẩm <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.maSanPham}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => {
                    const maSP = p.maSanPham ?? p.masanpham;
                    const tenSP =
                      p.tenSanPham ?? p.tensanpham ?? `SP#${maSP}`;
                    return (
                      <option key={maSP} value={maSP}>
                        {tenSP}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kích thước
                  </label>
                  <select
                    value={formData.kichThuoc}
                    onChange={(e) =>
                      setFormData({ ...formData, kichThuoc: e.target.value })
                    }
                    disabled={!formData.maSanPham}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">-- Chọn size --</option>
                    {sizeOptions.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu sắc
                  </label>
                  <select
                    value={formData.mauSac}
                    onChange={(e) =>
                      setFormData({ ...formData, mauSac: e.target.value })
                    }
                    disabled={!formData.maSanPham}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">-- Chọn màu --</option>
                    {colorOptions.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chất liệu
                </label>
                <select
                  value={formData.chatLieu}
                  onChange={(e) =>
                    setFormData({ ...formData, chatLieu: e.target.value })
                  }
                  disabled={!chatLieuOptions.length}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">
                    {chatLieuOptions.length ? "-- Chọn chất liệu --" : "Không có dữ liệu"}
                  </option>
                  {chatLieuOptions.map((chatLieu) => (
                    <option key={chatLieu} value={chatLieu}>
                      {chatLieu}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.soLuong}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      soLuong: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đơn giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.donGia}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      donGia: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thành tiền
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium">
                  {fmtCurrency(formData.soLuong * formData.donGia)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) =>
                    setFormData({ ...formData, ghiChu: e.target.value })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
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
