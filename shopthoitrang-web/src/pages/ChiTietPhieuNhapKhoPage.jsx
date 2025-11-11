// src/pages/ChiTietPhieuNhapKhoPage.jsx
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

import phieuNhapKhoService from "../services/phieunhapkhoService";
import chitietphieunhapService from "../services/chitietphieunhapService";
import chitietphieudathangService from "../services/chitietphieudathangService";
import phieuDatHangService from "../services/phieuDatHangService";
import sanphamService from "../services/sanphamService";
import chitietsanphamService from "../services/chitietsanphamService";
import nhacungcapService from "../services/nhacungcapService";
import nhanvienService from "../services/nhanvienService";
import { useAuth } from "../contexts/AuthContext";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

// Chuẩn hoá trạng thái: bỏ dấu, lowercase
const normalizeStatus = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export default function ChiTietPhieuNhapKhoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phieu, setPhieu] = useState(null);
  const [items, setItems] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDetails, setProductDetails] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [subErr, setSubErr] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    maSanPham: "",
    kichThuoc: "",
    mauSac: "",
    soLuong: 1,
    ghiChu: "",
  });
  const [saving, setSaving] = useState(false);

  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    ngayNhap: "",
    ghiChu: "",
  });

  // ===== Helper: id -> tên NCC / NV =====
  const getTenNhaCungCap = (maNCC) => {
    if (!maNCC) return "—";
    const found = suppliers.find(
      (s) =>
        s.maNhaCungCap === maNCC ||
        s.manhacungcap === maNCC ||
        Number(s.maNhaCungCap ?? s.manhacungcap) === Number(maNCC)
    );
    return found?.tenNhaCungCap ?? found?.tennhacungcap ?? `#${maNCC}`;
  };

  const getTenNhanVien = (maNV) => {
    if (!maNV) return "—";
    const found = employees.find(
      (e) =>
        e.maNhanVien === maNV ||
        e.manhanvien === maNV ||
        Number(e.maNhanVien ?? e.manhanvien) === Number(maNV)
    );
    return found?.hoTen ?? found?.hoten ?? `#${maNV}`;
  };

  // ===== Load data =====
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
      const [pRes, nccRes, nvRes] = await Promise.all([
        phieuNhapKhoService.getById(id),
        nhacungcapService.getAll(),
        nhanvienService.getAll(),
      ]);

      setPhieu(pRes || null);
      setSuppliers(Array.isArray(nccRes) ? nccRes : nccRes?.data ?? []);
      setEmployees(Array.isArray(nvRes) ? nvRes : nvRes?.data ?? []);
    } catch (e) {
      console.error("Lỗi load phiếu nhập:", e);
      setErr("Không tải được dữ liệu phiếu nhập kho.");
      setLoading(false);
      return;
    }

    try {
      const [
        detailNhapRes,
        productRes,
        productDetailRes,
        orderDetailRes,
        purchaseOrdersRes,
      ] = await Promise.allSettled([
        chitietphieunhapService.getByPhieu(id),
        sanphamService.getAll(),
        chitietsanphamService.getAll(),
        chitietphieudathangService.getAll(),
        phieuDatHangService.getAll(),
      ]);

      // chi tiết nhập
      if (detailNhapRes.status === "fulfilled") {
        let data = detailNhapRes.value;
        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data?.data)) arr = data.data;
        else if (data && typeof data === "object") arr = Object.values(data);
        arr = arr.filter(
          (it) => Number(it.maPhieuNhap ?? it.maphieunhap) === idNum
        );
        setItems(arr);
      } else {
        console.error("Lỗi chi tiết phiếu nhập:", detailNhapRes.reason);
        setItems([]);
        setSubErr("Không thể tải danh sách chi tiết phiếu nhập kho.");
      }

      // sản phẩm
      if (productRes.status === "fulfilled") {
        const d = productRes.value;
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setProducts(arr);
      }

      // chi tiết sản phẩm
      if (productDetailRes.status === "fulfilled") {
        const d = productDetailRes.value;
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setProductDetails(arr);
      }

      // chi tiết phiếu đặt hàng
      if (orderDetailRes.status === "fulfilled") {
        const d = orderDetailRes.value;
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setOrderDetails(arr);
      } else {
        console.error("Lỗi chi tiết phiếu đặt hàng:", orderDetailRes.reason);
        setOrderDetails([]);
      }

      // danh sách phiếu đặt hàng
      if (purchaseOrdersRes.status === "fulfilled") {
        const d = purchaseOrdersRes.value;
        const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        setPurchaseOrders(arr);
      } else {
        console.error("Lỗi load phiếu đặt hàng:", purchaseOrdersRes.reason);
        setPurchaseOrders([]);
      }
    } catch (e) {
      console.error("Lỗi bất ngờ:", e);
      if (!subErr) setSubErr("Có lỗi khi tải dữ liệu chi tiết.");
    } finally {
      setLoading(false);
    }
  };

  // đồng bộ header form
  useEffect(() => {
    if (phieu) {
      setHeaderForm({
        ngayNhap:
          (phieu.ngayNhap ?? phieu.ngaynhap ?? "")
            .toString()
            .split("T")[0] || "",
        ghiChu: phieu.ghiChu ?? phieu.ghichu ?? "",
      });
    }
  }, [phieu]);

  // ===== Map product info cho 1 dòng chi tiết nhập =====
  const getProductInfoFromRow = (row) => {
    const maCT = row.maChiTietSanPham ?? row.machitietsanpham;
    let chiTiet = null;
    if (maCT != null) {
      chiTiet = productDetails.find(
        (pd) =>
          Number(pd.maChiTietSanPham ?? pd.machitietsanpham) === Number(maCT)
      );
    }

    let maSP = chiTiet?.maSanPham ?? chiTiet?.masanpham ?? null;
    let sanPham = null;
    if (maSP != null) {
      sanPham = products.find(
        (p) => Number(p.maSanPham ?? p.masanpham) === Number(maSP)
      );
    }

    const tenSP =
      sanPham?.tenSanPham ??
      sanPham?.tensanpham ??
      (maSP != null ? `SP#${maSP}` : maCT != null ? `#${maCT}` : "—");

    const kichThuoc = chiTiet?.kichThuoc ?? chiTiet?.kichthuoc ?? null;
    const mauSac = chiTiet?.mauSac ?? chiTiet?.mausac ?? null;

    return {
      tenSanPham: tenSP,
      kichThuoc,
      mauSac,
      maChiTietSanPham: maCT,
      maSanPham: maSP,
    };
  };

  // ===== Tổng số lượng ĐẶT cho 1 CTSP (chỉ đơn ĐÃ DUYỆT của đúng NCC) =====
  const getSoLuongDat = (maChiTietSanPham) => {
    if (
      !maChiTietSanPham ||
      !orderDetails.length ||
      !purchaseOrders.length ||
      !phieu
    ) {
      return 0;
    }

    const maNCCPhieu = phieu.maNhaCungCap ?? phieu.manhacungcap ?? null;
    if (!maNCCPhieu) return 0;

    return orderDetails
      .filter((od) => {
        const maCT = od.maChiTietSanPham ?? od.machitietsanpham;
        if (Number(maCT) !== Number(maChiTietSanPham)) return false;

        const maPDH = od.maPhieuDatHang ?? od.maphieudathang;
        if (!maPDH) return false;

        const phieuDH = purchaseOrders.find(
          (p) =>
            Number(p.maPhieuDatHang ?? p.maphieudathang) === Number(maPDH)
        );
        if (!phieuDH) return false;

        const status = (
          phieuDH.trangThaiPhieu ??
          phieuDH.trangthaiphieu ??
          ""
        )
          .toString()
          .toLowerCase()
          .trim();
        if (!status.includes("duyệt")) return false;

        const nccPDH = phieuDH.maNhaCungCap ?? phieuDH.manhacungcap;
        return Number(nccPDH) === Number(maNCCPhieu);
      })
      .reduce((sum, od) => sum + Number(od.soLuong ?? od.soluong ?? 0), 0);
  };

  // ===== Tổng số lượng đã nhập trong phiếu hiện tại =====
  const getTongSoLuongNhapForProduct = (maChiTietSanPham) => {
    if (!maChiTietSanPham) return 0;
    return items
      .filter(
        (it) =>
          Number(it.maChiTietSanPham ?? it.machitietsanpham) ===
          Number(maChiTietSanPham)
      )
      .reduce((sum, it) => sum + Number(it.soLuong ?? it.soluong ?? 0), 0);
  };

  const getSoLuongCanNhap = (maChiTietSanPham) => {
    const soLuongDat = getSoLuongDat(maChiTietSanPham);
    if (soLuongDat === 0) return 0;
    const tongNhap = getTongSoLuongNhapForProduct(maChiTietSanPham);
    const rs = soLuongDat - tongNhap;
    return rs > 0 ? rs : 0;
  };

  const summary = useMemo(() => {
    let tongSoLuong = 0;
    for (const it of items) {
      tongSoLuong += Number(it.soLuong ?? it.soluong ?? 0);
    }
    return { tongSoLuong };
  }, [items]);

  // ===== CTSP có thể chọn: chỉ từ ĐƠN ĐÃ DUYỆT của đúng NCC & còn cần nhập =====
  const selectableProductDetails = useMemo(() => {
    if (
      !productDetails.length ||
      !orderDetails.length ||
      !purchaseOrders.length ||
      !phieu
    ) {
      return [];
    }

    const maNCCPhieu = phieu.maNhaCungCap ?? phieu.manhacungcap ?? null;
    if (!maNCCPhieu) return [];

    const mapPhieuDatHang = new Map();
    purchaseOrders.forEach((p) => {
      const idPDH = p.maPhieuDatHang ?? p.maphieudathang;
      if (!idPDH) return;

      const status = (
        p.trangThaiPhieu ??
        p.trangthaiphieu ??
        ""
      )
        .toString()
        .toLowerCase()
        .trim();
      if (!status.includes("duyệt")) return;

      mapPhieuDatHang.set(Number(idPDH), p);
    });

    const orderedMap = new Map();
    orderDetails.forEach((od) => {
      const maCT = od.maChiTietSanPham ?? od.machitietsanpham;
      if (!maCT) return;

      const maPDH = od.maPhieuDatHang ?? od.maphieudathang;
      if (!maPDH) return;

      const phieuDH = mapPhieuDatHang.get(Number(maPDH));
      if (!phieuDH) return;

      const nccPDH = phieuDH.maNhaCungCap ?? phieuDH.manhacungcap;
      if (Number(nccPDH) !== Number(maNCCPhieu)) return;

      const sl = Number(od.soLuong ?? od.soluong ?? 0) || 0;
      orderedMap.set(maCT, (orderedMap.get(maCT) || 0) + sl);
    });

    let list = productDetails.filter((pd) => {
      const maCT = pd.maChiTietSanPham ?? pd.machitietsanpham;
      const soLuongDat = orderedMap.get(maCT) || 0;
      if (!soLuongDat) return false;

      const soLuongCanNhap = getSoLuongCanNhap(maCT);
      return soLuongCanNhap > 0;
    });

    const editingMaCT = editingItem
      ? editingItem.maChiTietSanPham ?? editingItem.machitietsanpham
      : null;
    if (editingMaCT) {
      const exists = list.some(
        (pd) =>
          Number(pd.maChiTietSanPham ?? pd.machitietsanpham) ===
          Number(editingMaCT)
      );
      if (!exists) {
        const pd = productDetails.find(
          (p) =>
            Number(p.maChiTietSanPham ?? p.machitietsanpham) ===
            Number(editingMaCT)
        );
        if (pd) list = [...list, pd];
      }
    }

    return list;
  }, [productDetails, orderDetails, purchaseOrders, items, phieu, editingItem]);

  // ===== Options cho dropdown =====
  const productOptions = useMemo(() => {
    const map = new Map();
    selectableProductDetails.forEach((pd) => {
      const maSP = pd.maSanPham ?? pd.masanpham;
      if (!maSP) return;
      if (map.has(maSP)) return;
      const sp = products.find(
        (p) => Number(p.maSanPham ?? p.masanpham) === Number(maSP)
      );
      const tenSP = sp?.tenSanPham ?? sp?.tensanpham ?? `SP#${maSP}`;
      map.set(maSP, tenSP);
    });
    return Array.from(map.entries()).map(([maSP, tenSP]) => ({ maSP, tenSP }));
  }, [selectableProductDetails, products]);

  const sizeOptions = useMemo(() => {
    if (!formData.maSanPham) return [];
    const set = new Set();
    selectableProductDetails.forEach((pd) => {
      const maSP = pd.maSanPham ?? pd.masanpham;
      if (Number(maSP) !== Number(formData.maSanPham)) return;
      const size = pd.kichThuoc ?? pd.kichthuoc;
      if (!size) return;
      set.add(size);
    });
    return Array.from(set);
  }, [selectableProductDetails, formData.maSanPham]);

  const colorOptions = useMemo(() => {
    if (!formData.maSanPham || !formData.kichThuoc) return [];
    const set = new Set();
    selectableProductDetails.forEach((pd) => {
      const maSP = pd.maSanPham ?? pd.masanpham;
      if (Number(maSP) !== Number(formData.maSanPham)) return;
      const size = pd.kichThuoc ?? pd.kichthuoc;
      if (size !== formData.kichThuoc) return;
      const color = pd.mauSac ?? pd.mausac;
      if (!color) return;
      set.add(color);
    });
    return Array.from(set);
  }, [selectableProductDetails, formData.maSanPham, formData.kichThuoc]);

  const selectedDetail = useMemo(() => {
    if (!formData.maSanPham) return null;
    return (
      productDetails.find((pd) => {
        const maSP = pd.maSanPham ?? pd.masanpham;
        const size = pd.kichThuoc ?? pd.kichthuoc;
        const color = pd.mauSac ?? pd.mausac;
        return (
          Number(maSP) === Number(formData.maSanPham) &&
          (!formData.kichThuoc || size === formData.kichThuoc) &&
          (!formData.mauSac || color === formData.mauSac)
        );
      }) || null
    );
  }, [productDetails, formData.maSanPham, formData.kichThuoc, formData.mauSac]);

  const selectedMaChiTiet = selectedDetail
    ? selectedDetail.maChiTietSanPham ?? selectedDetail.machitietsanpham
    : null;

  const currentSoLuongCanNhap = selectedMaChiTiet
    ? getSoLuongCanNhap(selectedMaChiTiet)
    : 0;

  // ======= Quyền + trạng thái =======
  const role = user?.maQuyen;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

  const trangThai = phieu?.trangThai ?? phieu?.trangthai ?? "Tạo mới";
  const normalizedStatus = normalizeStatus(trangThai);

  // chỉ được sửa khi "Tạo mới"
  const canEdit = normalizedStatus === "tao moi";
  // nút GỬI: mọi role, chỉ khi "Tạo mới"
  const canSend = normalizedStatus === "tao moi";
  // nút DUYỆT / HỦY: ADMIN + MANAGER, khi "Chờ xác nhận"
  const canApprove =
    (isAdmin || isManager) && normalizedStatus === "cho xac nhan";

  // ========== Form thêm / sửa chi tiết ==========
  const handleOpenForm = (item = null) => {
    if (!canEdit) return; // chặn khi không được sửa

    if (item) {
      setEditingItem(item);
      const maCT = item.maChiTietSanPham ?? item.machitietsanpham;
      const chiTiet = productDetails.find(
        (pd) =>
          Number(pd.maChiTietSanPham ?? pd.machitietsanpham) === Number(maCT)
      );
      const maSP = chiTiet?.maSanPham ?? chiTiet?.masanpham ?? "";

      setFormData({
        maSanPham: maSP ? String(maSP) : "",
        kichThuoc: chiTiet?.kichThuoc ?? chiTiet?.kichthuoc ?? "",
        mauSac: chiTiet?.mauSac ?? chiTiet?.mausac ?? "",
        soLuong: Number(item.soLuong ?? item.soluong ?? 1),
        ghiChu: item.ghiChu ?? item.ghichu ?? "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        maSanPham: "",
        kichThuoc: "",
        mauSac: "",
        soLuong: 1,
        ghiChu: "",
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
      ghiChu: "",
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!formData.maSanPham) {
      alert("Vui lòng chọn sản phẩm!");
      return;
    }
    if (!formData.kichThuoc) {
      alert("Vui lòng chọn size!");
      return;
    }
    if (!formData.mauSac) {
      alert("Vui lòng chọn màu sắc!");
      return;
    }
    if (!formData.soLuong || formData.soLuong <= 0) {
      alert("Số lượng nhập phải lớn hơn 0!");
      return;
    }

    const chiTiet = productDetails.find((pd) => {
      const maSP = pd.maSanPham ?? pd.masanpham;
      const size = pd.kichThuoc ?? pd.kichthuoc;
      const color = pd.mauSac ?? pd.mausac;
      return (
        Number(maSP) === Number(formData.maSanPham) &&
        size === formData.kichThuoc &&
        color === formData.mauSac
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

    // kiểm tra không vượt số lượng ĐẶT (chỉ tính đơn đã duyệt)
    const soLuongDat = getSoLuongDat(maChiTietSanPham);
    if (soLuongDat > 0) {
      const tongNhapHienTai = getTongSoLuongNhapForProduct(maChiTietSanPham);

      let soLuongCu = 0;
      if (
        editingItem &&
        Number(editingItem.maChiTietSanPham ?? editingItem.machitietsanpham) ===
          Number(maChiTietSanPham)
      ) {
        soLuongCu = Number(editingItem.soLuong ?? editingItem.soluong ?? 0);
      }

      const tongNhapSauKhiLuu =
        tongNhapHienTai - soLuongCu + Number(formData.soLuong);

      if (tongNhapSauKhiLuu > soLuongDat) {
        alert(
          `Số lượng nhập (${tongNhapSauKhiLuu}) vượt quá số lượng đặt (${soLuongDat}) cho sản phẩm này!\nVui lòng kiểm tra lại.`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        maPhieuNhap: Number(id),
        maChiTietSanPham: Number(maChiTietSanPham),
        soLuong: Number(formData.soLuong),
        ghiChu: formData.ghiChu || "",
      };

      if (editingItem) {
        const maChiTiet =
          editingItem.maChiTietNhap ?? editingItem.machitietnhap;
        await chitietphieunhapService.update(maChiTiet, payload);
      } else {
        await chitietphieunhapService.create(payload);
      }

      await loadData();
      handleCloseForm();
      alert(
        editingItem
          ? "Cập nhật chi tiết phiếu nhập thành công!"
          : "Thêm chi tiết phiếu nhập thành công!"
      );
    } catch (error) {
      console.error("Lỗi khi lưu chi tiết phiếu nhập:", error);
      const msg =
        error.response?.data?.message || error.message || "Có lỗi xảy ra";
      alert(`Có lỗi xảy ra khi lưu chi tiết phiếu nhập!\n\nChi tiết: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!canEdit) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa dòng chi tiết này?")) return;
    try {
      const maChiTiet = item.maChiTietNhap ?? item.machitietnhap;
      await chitietphieunhapService.delete(maChiTiet);
      await loadData();
    } catch (error) {
      console.error("Lỗi khi xóa chi tiết phiếu nhập:", error);
      alert("Có lỗi xảy ra khi xóa chi tiết!");
    }
  };

  // ========== Lưu header ==========
  const handleSaveHeader = async () => {
    if (!canEdit) return;
    try {
      setSaving(true);
      const payload = {
        ...phieu,
        ngayNhap: headerForm.ngayNhap || null,
        ghiChu: headerForm.ghiChu || null,
      };

      const maPhieu = phieu?.maPhieuNhap ?? phieu?.maphieunhap ?? id;
      await phieuNhapKhoService.update(maPhieu, payload);
      await loadData();
      setEditingHeader(false);
      alert("Cập nhật thông tin phiếu nhập kho thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu nhập:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin phiếu nhập!");
    } finally {
      setSaving(false);
    }
  };

  // ====== GỬI / DUYỆT / HỦY PHIẾU NHẬP ======

  const handleSendReceipt = async () => {
    if (!phieu || !canSend) return;
    if (
      !window.confirm(
        "Bạn chắc chắn muốn gửi phiếu nhập kho này cho quản lý xác nhận?\nSau khi gửi, bạn sẽ không thể chỉnh sửa phiếu."
      )
    )
      return;

    try {
      setSaving(true);
      const maPhieu = phieu.maPhieuNhap ?? phieu.maphieunhap ?? id;

      await phieuNhapKhoService.update(maPhieu, {
        ...phieu,
        trangThai: "Chờ xác nhận",
      });

      await loadData();
      alert("Đã gửi phiếu nhập kho cho quản lý xác nhận.");
      // TODO: thông báo cho quản lý
    } catch (error) {
      console.error("Lỗi khi gửi phiếu nhập:", error);
      alert("Có lỗi xảy ra khi gửi phiếu nhập kho!");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReceipt = async () => {
    if (!phieu || !canApprove) return;
    if (!window.confirm("Bạn có chắc chắn muốn duyệt phiếu nhập kho này?"))
      return;

    try {
      setSaving(true);
      const maPhieu = phieu.maPhieuNhap ?? phieu.maphieunhap ?? id;

      await phieuNhapKhoService.update(maPhieu, {
        ...phieu,
        trangThai: "Đã duyệt",
      });

      await loadData();
      alert("Đã duyệt phiếu nhập kho.");
      // TODO: thông báo cho nhân viên tạo phiếu
    } catch (error) {
      console.error("Lỗi khi duyệt phiếu nhập:", error);
      alert("Có lỗi xảy ra khi duyệt phiếu nhập kho!");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReceipt = async () => {
    if (!phieu || !canApprove) return;
    const reason = window.prompt("Nhập lý do hủy phiếu nhập kho:");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do hủy.");
      return;
    }

    try {
      setSaving(true);
      const maPhieu = phieu.maPhieuNhap ?? phieu.maphieunhap ?? id;

      await phieuNhapKhoService.update(maPhieu, {
        ...phieu,
        trangThai: "Đã hủy",
        // nếu DB có cột lý do hủy thì thêm ở đây
        // lyDoHuy: reason,
      });

      await loadData();
      alert(`Đã hủy phiếu nhập kho.\nLý do: ${reason}`);
      // TODO: gửi thông báo cho nhân viên tạo phiếu kèm lý do hủy
    } catch (error) {
      console.error("Lỗi khi hủy phiếu nhập:", error);
      alert("Có lỗi xảy ra khi hủy phiếu nhập kho!");
    } finally {
      setSaving(false);
    }
  };

  // ========== UI ==========

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-700">
          Đang tải chi tiết phiếu nhập kho…
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
          {err || "Không tìm thấy phiếu nhập kho."}
        </div>
      </div>
    );
  }

  const maPhieu = phieu.maPhieuNhap ?? phieu.maphieunhap;
  const maNCC = phieu.maNhaCungCap ?? phieu.manhacungcap;
  const maNV = phieu.maNhanVien ?? phieu.manhanvien;
  const tenNCC = getTenNhaCungCap(maNCC);
  const tenNV = getTenNhanVien(maNV);
  const ngayNhap = phieu.ngayNhap ?? phieu.ngaynhap;
  const ghiChuPhieu = phieu.ghiChu ?? phieu.ghichu;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <FileText className="text-blue-600" size={32} />
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Phiếu nhập kho #{maPhieu}
              </h1>
              <span
                className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                  trangThai?.toLowerCase().includes("hủy")
                    ? "bg-red-100 text-red-700"
                    : trangThai?.toLowerCase().includes("duyệt")
                    ? "bg-green-100 text-green-700"
                    : trangThai?.toLowerCase().includes("chờ")
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {trangThai || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canSend && (
            <button
              onClick={handleSendReceipt}
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
                onClick={handleApproveReceipt}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-600 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                Duyệt
              </button>
              <button
                onClick={handleCancelReceipt}
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

      {/* Thông tin phiếu + Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thông tin phiếu nhập */}
        <div className="bg-white border rounded-xl p-4 md:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">
              Thông tin phiếu nhập
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
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">Nhà cung cấp:</span>
                <span>{tenNCC || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">Nhân viên nhập:</span>
                <span>{tenNV || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="font-medium">Ngày nhập:</span>
                {editingHeader ? (
                  <input
                    type="date"
                    value={headerForm.ngayNhap}
                    onChange={(e) =>
                      setHeaderForm((f) => ({
                        ...f,
                        ngayNhap: e.target.value,
                      }))
                    }
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <span>{fmtDate(ngayNhap)}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="py-1 border-b">
                <span className="font-medium">Ghi chú:</span>
                {editingHeader ? (
                  <textarea
                    value={headerForm.ghiChu}
                    onChange={(e) =>
                      setHeaderForm((f) => ({ ...f, ghiChu: e.target.value }))
                    }
                    rows={3}
                    className="mt-1 w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="mt-1 text-gray-700">
                    {ghiChuPhieu || (
                      <span className="text-gray-400">Không có</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {editingHeader && canEdit && (
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setHeaderForm({
                    ngayNhap:
                      (phieu.ngayNhap ?? phieu.ngaynhap ?? "")
                        .toString()
                        .split("T")[0] || "",
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
              <span className="font-medium">Số dòng chi tiết: </span>
              {items.length}
            </div>
            <div>
              <span className="font-medium">Tổng số lượng nhập: </span>
              {summary.tongSoLuong}
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết phiếu nhập kho */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Chi tiết phiếu nhập kho
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
                    Màu sắc
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Số lượng nhập
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
                  const { tenSanPham, kichThuoc, mauSac } =
                    getProductInfoFromRow(it);

                  const soLuongNhap = Number(it.soLuong ?? it.soluong ?? 0);

                  return (
                    <tr
                      key={it.maChiTietNhap ?? it.machitietnhap}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {tenSanPham}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {kichThuoc ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {mauSac ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {soLuongNhap}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {it.ghiChu ?? it.ghichu ?? "—"}
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
                {editingItem ? "Chỉnh sửa chi tiết nhập" : "Thêm chi tiết nhập mới"}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {/* Sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sản phẩm <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.maSanPham}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      maSanPham: e.target.value,
                      kichThuoc: "",
                      mauSac: "",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {productOptions.map((p) => (
                    <option key={p.maSP} value={p.maSP}>
                      {p.tenSP}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size & Màu */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.kichThuoc}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        kichThuoc: e.target.value,
                        mauSac: "",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!formData.maSanPham}
                  >
                    <option value="">-- Chọn size --</option>
                    {sizeOptions.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu sắc <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.mauSac}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        mauSac: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!formData.kichThuoc}
                  >
                    <option value="">-- Chọn màu --</option>
                    {colorOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Số lượng cần nhập (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng cần nhập
                </label>
                <input
                  type="number"
                  value={currentSoLuongCanNhap}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-right"
                />
              </div>

              {/* Số lượng nhập */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.soLuong}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      soLuong: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, ghiChu: e.target.value }))
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
