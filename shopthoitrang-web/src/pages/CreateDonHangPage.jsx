import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import donhangService from "../services/donhangService";
import khachhangService from "../services/khachhangService";
import sanphamService from "../services/sanphamService";
import chitietsanphamService from "../services/chitietsanphamService";
import { useAuth } from "../contexts/AuthContext";

// format helpers
const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

export default function CreateDonHangPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  
  // Customer search
  const [phoneSearch, setPhoneSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  // Customer data
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  // Products data
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Order form
  const [orderItems, setOrderItems] = useState([]);
  const [phuongThucThanhToan, setPhuongThucThanhToan] = useState("Tiền mặt");
  const [trangThaiThanhToan, setTrangThaiThanhToan] = useState("Đã thanh toán");
  const [phiVanChuyen, setPhiVanChuyen] = useState(0);
  const [diaChiGiaoHang, setDiaChiGiaoHang] = useState("140 Lê Trọng Tấn");
  
  // Search customer by phone
  const searchCustomerByPhone = async () => {
    const phone = phoneSearch.trim();
    if (!phone) {
      setErr("Vui lòng nhập số điện thoại");
      return;
    }
    
    try {
      setSearchingCustomer(true);
      setErr("");
      
      // Load all customers and search
      const allCustomers = await khachhangService.getAll();
      const found = allCustomers.find(c => c.sodienthoai === phone);
      
      if (found) {
        // Existing customer
        setSelectedCustomer(found);
        setCustomerName(found.hoten || "");
        setIsNewCustomer(false);
        
        // Load addresses (don't show error if this fails)
        try {
          const addresses = await khachhangService.getDiaChi(found.makhachhang);
          setCustomerAddresses(Array.isArray(addresses) ? addresses : []);
          if (addresses && addresses.length > 0) {
            setSelectedAddress(addresses[0]);
          }
        } catch (addrErr) {
          console.warn("Could not load addresses:", addrErr);
          setCustomerAddresses([]);
        }
      } else {
        // New customer
        setSelectedCustomer(null);
        setCustomerName("");
        setIsNewCustomer(true);
        setCustomerAddresses([]);
        setSelectedAddress(null);
      }
    } catch (e) {
      console.error("Error searching customer:", e);
      setErr("Không thể tìm kiếm khách hàng. Vui lòng thử lại.");
    } finally {
      setSearchingCustomer(false);
    }
  };
  
  // Create new customer
  const createNewCustomer = async () => {
    const phone = phoneSearch.trim();
    const name = customerName.trim();
    
    if (!phone || !name) {
      const error = "Vui lòng nhập đầy đủ số điện thoại và họ tên";
      console.error("createNewCustomer validation failed:", error);
      setErr(error);
      return null;
    }
    
    const payload = {
      hoten: name,
      tendangnhap: phone,  // Use phone as unique username
      pass: "123456",
      sodienthoai: phone,
      email: "",
      danghoatdong: true
    };
    
    console.log("Creating new customer with payload:", payload);
    
    try {
      const newCustomer = await khachhangService.create(payload);
      console.log("Successfully created new customer:", newCustomer);
      return newCustomer;
    } catch (e) {
      console.error("Error creating customer:", e);
      console.error("Error response:", e?.response?.data);
      throw e;
    }
  };
  
  // Load customers (for initial load if needed)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCustomersLoading(true);
        const data = await khachhangService.getAll();
        if (mounted) setCustomers(data || []);
      } catch (e) {
        console.error("Error loading customers:", e);
        if (mounted) setErr("Không thể tải danh sách khách hàng");
      } finally {
        if (mounted) setCustomersLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  
  // Load products
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setProductsLoading(true);
        const data = await sanphamService.getAll();
        if (mounted) setProducts(data || []);
      } catch (e) {
        console.error("Error loading products:", e);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  
  // Load customer addresses when customer selected
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerAddresses([]);
      setSelectedAddress(null);
      return;
    }
    
    let mounted = true;
    (async () => {
      try {
        const data = await khachhangService.getDiaChi(selectedCustomer.makhachhang);
        if (mounted) {
          setCustomerAddresses(Array.isArray(data) ? data : []);
          if (data && data.length > 0) {
            setSelectedAddress(data[0]);
          }
        }
      } catch (e) {
        console.error("Error loading addresses:", e);
      }
    })();
    return () => { mounted = false; };
  }, [selectedCustomer]);
  

  const buildVariantEntries = async (rawVariants = []) => {
    const variantsWithSizes = await Promise.all(
      (rawVariants || []).map(async (variant) => {
        if (Array.isArray(variant.sizes) && variant.sizes.length) {
          return variant;
        }
        const maCT =
          variant?.machitietsanpham ??
          variant?.maChiTietSanPham ??
          variant?.id;
        if (!maCT) return { ...variant, sizes: [] };
        try {
          const sizeRows = await chitietsanphamService.getSizes(maCT);
          return { ...variant, sizes: sizeRows, machitietsanpham: maCT };
        } catch (err) {
          console.warn("Không thể tải size cho chi tiết sản phẩm", maCT, err);
          return { ...variant, sizes: [], machitietsanpham: maCT };
        }
      })
    );

    return variantsWithSizes.flatMap((variant) => {
      const sizeRows = Array.isArray(variant.sizes) ? variant.sizes : [];
      if (!sizeRows.length) {
        const tonKho = variant?.tonKho ?? variant?.soLuongTon ?? variant?.soLuong ?? 0;
        return [{ ...variant, tonKho, machitietsanpham: variant?.machitietsanpham ?? variant?.maChiTietSanPham ?? variant?.id }];
      }

      return sizeRows.map((sizeRow) => {
        const tonKhoSize = sizeRow?.soLuong ?? sizeRow?.so_luong ?? 0;
        const giaThem = sizeRow?.giaThem ?? sizeRow?.gia_them ?? 0;
        return {
          ...variant,
          maChiTietSanPhamKichThuoc:
            sizeRow?.id ??
            sizeRow?.maChiTietSanPhamKichThuoc ??
            sizeRow?.machitietsanpham_kichthuoc ??
            sizeRow?.bridgeId ??
            null,
          maKichThuoc:
            sizeRow?.maKichThuoc ??
            sizeRow?.makichthuoc ??
            sizeRow?.kichthuocs?.maKichThuoc ??
            sizeRow?.kichthuocs?.makichthuoc ??
            null,
          kichThuoc:
            sizeRow?.tenKichThuoc ??
            sizeRow?.ten_kichthuoc ??
            variant?.kichThuoc ??
            "",
          giaBan: (variant?.giaBan ?? 0) + (giaThem || 0),
          tonKho: tonKhoSize,
          machitietsanpham: variant?.machitietsanpham ?? variant?.maChiTietSanPham ?? variant?.id,
        };
      });
    });
  };
  
  // Add item to order
  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      id: Date.now(),
      maSanPham: "",
      maChiTietSanPham: "",
      variants: [],
      selectedVariant: null,
      selectedColor: "",
      selectedSize: "",
      soLuong: 1,
      donGia: 0,
    }]);
  };
  
  // Remove item from order
  const removeOrderItem = (id) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };
  
  // Load variants when product selected
  const handleProductChange = async (itemId, maSanPham) => {
    try {
      const variants = await chitietsanphamService.getByProductId(maSanPham);
      const normalizedVariants = await buildVariantEntries(variants || []);
      setOrderItems(items => items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              maSanPham, 
              variants: normalizedVariants, 
              maChiTietSanPham: "",
              selectedVariant: null,
              selectedColor: "",
              selectedSize: "",
              donGia: 0 
            }
          : item
      ));
    } catch (e) {
      console.error("Error loading variants:", e);
    }
  };
  
  // Update color selection
  const handleColorChange = (itemId, color) => {
    setOrderItems(items => items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          selectedColor: color,
          selectedSize: "", // Reset size when color changes
          maChiTietSanPham: "",
          selectedVariant: null,
          donGia: 0
        };
      }
      return item;
    }));
  };
  
  // Update size selection
  const handleSizeChange = (itemId, size) => {
    setOrderItems((items) =>
      items.map((item) => {
        if (item.id !== itemId) return item;
        const variant = item.variants.find(
          (v) => v.mauSac === item.selectedColor && v.kichThuoc === size
        );
        // Use per-size stock when available
        const tonKho =
          variant?.tonKho ?? variant?.soLuongTon ?? variant?.soLuong ?? 0;
        return {
          ...item,
          selectedSize: size,
          maChiTietSanPham: variant?.machitietsanpham ?? variant?.maChiTietSanPham ?? variant?.id ?? "",
          maChiTietSanPhamKichThuoc:
            variant?.maChiTietSanPhamKichThuoc ?? variant?.ma_chitietsanpham_kichthuoc ?? variant?.id ?? "",
          maKichThuoc: variant?.maKichThuoc ?? variant?.makichthuoc ?? variant?.ma_kichthuoc ?? "",
          selectedVariant: variant ? { ...variant, tonKho } : null,
          donGia: variant?.giaBan ?? variant?.giaban ?? 0,
          soLuong: item.soLuong > 0 ? item.soLuong : 1,
        };
      })
    );
  };

  // Update quantity
  const handleQuantityChange = (itemId, soLuong) => {
    const qty = Math.max(1, Number(soLuong) || 1);
    setOrderItems(items => items.map(item => 
      item.id === itemId ? { ...item, soLuong: qty } : item
    ));
  };
  
  // Calculate totals
  const subtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => 
      sum + (item.donGia * item.soLuong), 0
    );
  }, [orderItems]);
  
  const total = subtotal + phiVanChuyen;

  // Giảm tồn kho sau khi tạo đơn
  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    
    // Validation
    if (!phoneSearch.trim()) {
      setErr("Vui lòng nhập số điện thoại khách hàng");
      return;
    }
    
    if (isNewCustomer && !customerName.trim()) {
      setErr("Vui lòng nhập họ tên khách hàng mới");
      return;
    }
    
    if (!selectedCustomer && !isNewCustomer) {
      setErr("Vui lòng tìm kiếm khách hàng trước");
      return;
    }
    
    if (orderItems.length === 0) {
      setErr("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }
    
    for (const item of orderItems) {
      if (!item.maChiTietSanPham) {
        setErr("Vui lòng chọn đầy đủ sản phẩm và phân loại");
        return;
      }
      
      // Check stock quantity
      const stockQty = item.selectedVariant?.tonKho ?? item.selectedVariant?.soLuong ?? 0;
      if (item.soLuong > stockQty) {
        setErr(`Sản phẩm "${item.selectedVariant?.mauSac} - ${item.selectedVariant?.kichThuoc}" chỉ còn ${stockQty} trong kho, không đủ số lượng yêu cầu (${item.soLuong})`);
        return;
      }
    }
    
    try {
      setLoading(true);
      
      let customerId = selectedCustomer?.makhachhang;
      
      // If new customer, create account first
      if (isNewCustomer) {
        console.log("Creating new customer before order...");
        const newCustomer = await createNewCustomer();
        
        if (!newCustomer) {
          setErr("Không thể tạo tài khoản khách hàng");
          setLoading(false);
          return;
        }
        
        console.log("New customer created successfully:", newCustomer);
        customerId = newCustomer.makhachhang;
        setSelectedCustomer(newCustomer);
        setIsNewCustomer(false);
      }
      
      if (!customerId) {
        setErr("Không thể xác định khách hàng");
        setLoading(false);
        return;
      }
      
      console.log("Creating order for customer:", customerId);
      
      // Get logged in employee ID from useAuth hook
      const maNhanVien = user?.maNhanVien;
      
      console.log("Employee user from AuthContext:", user);
      console.log("Employee ID (maNhanVien):", maNhanVien);
      
      if (!maNhanVien) {
        console.warn("Warning: No employee ID found. User may not be logged in.");
        setErr("Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }
      
      // Align with VN timezone (UTC+7)
      const currentDate = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString();
      
      // Create order payload
      const orderPayload = {
        maKhachHang: customerId,
        maNhanVien: maNhanVien,
        nguonDon: 'POS', // Mark as POS order (employee-created)
        ngayDatHang: currentDate,
        ngayGiaoHang: currentDate,
        thanhTien: total,
        phuongThucThanhToan,
        trangThaiThanhToan,
        trangThaiDonHang: "Đã giao",
        phiVanChuyen,
        chiTietDonHang: orderItems
          .filter(item => item.maChiTietSanPham && item.soLuong > 0 && item.donGia > 0)
          .map(item => ({
            machitietsanpham: item.maChiTietSanPham ?? item.machitietsanpham ?? item.selectedVariant?.machitietsanpham ?? item.selectedVariant?.maChiTietSanPham ?? item.selectedVariant?.id,
            soluong: item.soLuong,
            dongia: item.donGia,
            chitietsize_id: Number(
              item.maChiTietSanPhamKichThuoc ||
              item.selectedVariant?.maChiTietSanPhamKichThuoc ||
              0
            ) || null,
          }))
      };
      
      // Add address: use selected address if exists, otherwise use default
      if (selectedAddress?.madiachi) {
        orderPayload.diaChiGiao = selectedAddress.madiachi;
      } else if (diaChiGiaoHang) {
        orderPayload.diaChiGiaoText = diaChiGiaoHang;
      }
      
      console.log("Creating order:", orderPayload);
      
      await donhangService.create(orderPayload);
      // Navigate back to orders page
      navigate("/donhang", { 
        state: { message: "Tạo đơn hàng thành công!" } 
      });
    } catch (e) {
      console.error("Error creating order:", e);
      setErr(e?.response?.data?.message || "Không thể tạo đơn hàng");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/donhang")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="bg-blue-100 p-2 rounded-lg">
            <ShoppingCart className="text-blue-600" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tạo đơn hàng mới</h1>
            <p className="text-gray-600">Tạo đơn hàng cho khách hàng</p>
          </div>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {err}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Search */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Thông tin khách hàng</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  placeholder="Nhập số điện thoại khách hàng"
                  className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={searchCustomerByPhone}
                  disabled={searchingCustomer || !phoneSearch.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {searchingCustomer ? "Đang tìm..." : "Tìm kiếm"}
                </button>
              </div>
            </div>
            
            {isNewCustomer && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <div className="text-yellow-600 font-semibold">⚠️ Khách hàng mới</div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nhập họ tên khách hàng"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
            
            {selectedCustomer && !isNewCustomer && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <div className="text-green-600 font-semibold">✓ Khách hàng đã tồn tại</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Mã KH:</span>
                    <span className="ml-2 font-medium">#{selectedCustomer.makhachhang}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Họ tên:</span>
                    <span className="ml-2 font-medium">{selectedCustomer.hoten || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedCustomer.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">SĐT:</span>
                    <span className="ml-2 font-medium">{selectedCustomer.sodienthoai || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {customerAddresses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ giao hàng <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAddress?.madiachi || ""}
                onChange={(e) => {
                  const addr = customerAddresses.find(a => a.madiachi === Number(e.target.value));
                  setSelectedAddress(addr || null);
                }}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                {customerAddresses.map(addr => (
                  <option key={addr.madiachi} value={addr.madiachi}>
                    {addr.diachicuthe}, {addr.phuong}, {addr.tinh}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Sản phẩm</h3>
            <button
              type="button"
              onClick={addOrderItem}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
            >
              <Plus size={18} />
              Thêm sản phẩm
            </button>
          </div>
          
          {orderItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
              Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item, idx) => (
                <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Sản phẩm <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.maSanPham}
                            onChange={(e) => handleProductChange(item.id, Number(e.target.value))}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            required
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map(p => (
                              <option key={p.maSanPham} value={p.maSanPham}>
                                {p.tenSanPham}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Màu sắc <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.selectedColor || ""}
                            onChange={(e) => handleColorChange(item.id, e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            disabled={!item.maSanPham}
                            required
                          >
                            <option value="">-- Chọn màu --</option>
                            {[...new Set(item.variants.map(v => v.mauSac))].map(color => (
                              <option key={color} value={color}>
                                {color}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Kích thước <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.selectedSize || ""}
                            onChange={(e) => handleSizeChange(item.id, e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            disabled={!item.selectedColor}
                            required
                          >
                            <option value="">-- Chọn size --</option>
                            {item.variants
                              .filter(v => v.mauSac === item.selectedColor)
                              .map(v => (
                                <option
                                  key={`${v.maChiTietSanPham}-${v.maKichThuoc || v.maChiTietSanPhamKichThuoc || v.kichThuoc}`}
                                  value={v.kichThuoc}
                                >
                                  {v.kichThuoc} - {fmtCurrency(v.giaBan)}
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Đơn giá
                          </label>
                          <div className="text-sm font-semibold text-gray-900 py-2">
                            {fmtCurrency(item.donGia)}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tồn kho
                          </label>
                          <div className={`text-sm font-semibold py-2 ${
                            (item.selectedVariant?.tonKho ?? 0) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.selectedVariant?.tonKho ?? 0}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Số lượng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.selectedVariant?.tonKho ?? 0}
                            value={item.soLuong}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm ${
                              item.selectedVariant && item.soLuong > (item.selectedVariant?.tonKho ?? 0)
                                ? 'border-red-500 bg-red-50'
                                : ''
                            }`}
                            required
                          />
                          {item.selectedVariant && item.soLuong > (item.selectedVariant?.tonKho ?? 0) && (
                            <p className="text-xs text-red-600 mt-1">
                              Vượt quá tồn kho!
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Thành tiền
                          </label>
                          <div className="text-sm font-bold text-blue-600 py-2">
                            {fmtCurrency(item.donGia * item.soLuong)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeOrderItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Payment & Shipping */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Thanh toán & Vận chuyển</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức thanh toán
              </label>
              <select
                value={phuongThucThanhToan}
                onChange={(e) => setPhuongThucThanhToan(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Tiền mặt</option>
                <option>Chuyển khoản</option>
                <option>COD</option>
                <option>MOMO</option>
                <option>Bank</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái thanh toán
              </label>
              <select
                value={trangThaiThanhToan}
                onChange={(e) => setTrangThaiThanhToan(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Chưa thanh toán</option>
                <option>Đã thanh toán</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nguồn đơn hàng
              </label>
              <input
                type="text"
                value="POS"
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng kết đơn hàng</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-gray-700">Tổng tiền hàng:</span>
              <span className="font-semibold">{fmtCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-700">Phí vận chuyển:</span>
              <span className="font-semibold">{fmtCurrency(phiVanChuyen)}</span>
            </div>
            <div className="border-t-2 border-blue-300 pt-3 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Tổng thanh toán:</span>
              <span className="text-2xl font-bold text-blue-600">{fmtCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/donhang")}
            className="px-6 py-3 border-2 rounded-lg hover:bg-gray-50 font-medium"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || orderItems.length === 0 || (!selectedCustomer && !isNewCustomer) || (isNewCustomer && !customerName.trim())}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Đang tạo...
              </>
            ) : (
              <>
                <Check size={20} />
                Tạo đơn hàng
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
