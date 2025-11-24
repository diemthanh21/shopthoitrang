import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import donhangService from '../services/donhangService';
import trahangService from '../services/trahangService';

// Build public storage URL from a stored path. Uses Vite env vars when available.
const STORAGE_BASE = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_STORAGE_BASE || '';
const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'minchunghinhanh';

function buildStorageUrl(path) {
  if (!path) return null;
  const p = path.toString().trim();
  if (!p) return null;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (!STORAGE_BASE) return p; // no base configured, return raw path
  const clean = p.replace(/^\/+/, '');
  // if path already contains bucket prefix
  if (clean.startsWith(STORAGE_BUCKET)) {
    return `${STORAGE_BASE.replace(/\/$/, '')}/storage/v1/object/public/${clean}`;
  }
  // if includes bucket somewhere, just append after public
  if (clean.includes(`${STORAGE_BUCKET}/`)) {
    return `${STORAGE_BASE.replace(/\/$/, '')}/storage/v1/object/public/${clean}`;
  }
  return `${STORAGE_BASE.replace(/\/$/, '')}/storage/v1/object/public/${STORAGE_BUCKET}/${clean}`;
}

function parseMedia(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString('vi-VN');
  } catch {
    return ts;
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function DonHangDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await donhangService.getById(id);
        setOrderDetail(data);

        // Lấy danh sách phiếu trả hàng gắn với đơn này
        const returns = await trahangService.getByOrder(id);
        setReturnItems(Array.isArray(returns) ? returns : []);
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.message || 'Không tải được chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!orderDetail) {
    return <div className="p-8 text-center text-gray-500">Không tìm thấy đơn hàng</div>;
  }

  // Map phiếu trả hàng theo mã CTSP để hiển thị sản phẩm + tính tiền
  const returnByVariant = (() => {
    if (!Array.isArray(returnItems) || returnItems.length === 0) return null;
    const map = new Map();
    returnItems.forEach((r) => {
      const key = r.maChiTietSanPham;
      if (!key) return;
      const current = map.get(key) || [];
      current.push(r);
      map.set(key, current);
    });
    return map;
  })();

  const computedReturnLines = (() => {
    if (!returnByVariant || !Array.isArray(orderDetail.items)) return [];
    const lines = [];
    orderDetail.items.forEach((it) => {
      const list = returnByVariant.get(it.maChiTietSanPham);
      if (!list || list.length === 0) return;
      const totalQty = list.reduce((sum, r) => sum + (Number(r.soLuong) || 0), 0);
      if (!totalQty) return;
      const unitPrice = it.donGia || it.thanhTien / (it.soLuong || 1) || 0;
      const amount = unitPrice * totalQty;
      lines.push({ item: it, quantity: totalQty, unitPrice, amount });
    });
    return lines;
  })();
  const totalReturnAmount = computedReturnLines.reduce((s, l) => s + (l.amount || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Chi tiết đơn hàng</h1>
          <p className="text-gray-600">Mã đơn #{orderDetail.maDonHang}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded hover:bg-gray-100 transition"
        >
          Quay lại
        </button>
      </div>

      <div className="space-y-6">
        {/* Order info grid */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Thông tin đơn hàng</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Mã đơn</div>
              <div className="font-semibold text-base">{orderDetail.maDonHang}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Ngày đặt</div>
              <div className="font-semibold text-base">
                {orderDetail.ngayDatHang ? formatTime(orderDetail.ngayDatHang) : ''}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">PT thanh toán</div>
              <div className="font-semibold text-base">{orderDetail.phuongThucThanhToan || ''}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">TT thanh toán</div>
              <div className="font-semibold text-base">{orderDetail.trangThaiThanhToan || ''}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-500 mb-1">Trạng thái đơn</div>
              <div className="font-semibold text-base text-blue-600">{orderDetail.trangThaiDonHang || ''}</div>
            </div>
          </div>
        </div>

        {/* Customer info */}
        {orderDetail.khachHang && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Khách hàng</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Mã KH:</span>
                <span className="ml-2 font-medium">{orderDetail.khachHang.makhachhang || orderDetail.khachHang.maKH || orderDetail.maKhachHang}</span>
              </div>
              <div>
                <span className="text-gray-500">Họ tên:</span>
                <span className="ml-2 font-medium">{orderDetail.khachHang.hoten || orderDetail.khachHang.ten || ''}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{orderDetail.khachHang.email || ''}</span>
              </div>
              <div>
                <span className="text-gray-500">SĐT:</span>
                <span className="ml-2 font-medium">{orderDetail.khachHang.sodienthoai || orderDetail.khachHang.sdt || ''}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery address - ưu tiên địa chỉ khách đặt đơn */}
        {orderDetail.diaChi && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Địa chỉ giao hàng</h3>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-500">Người nhận:</span>
                <span className="ml-2 font-medium">{orderDetail.diaChi.ten || orderDetail.diaChi.nguoinhan || orderDetail.khachHang?.hoten || ''}</span>
              </div>
              <div>
                <span className="text-gray-500">SĐT:</span>
                <span className="ml-2 font-medium">{orderDetail.diaChi.sodienthoai || orderDetail.diaChi.sdt || orderDetail.khachHang?.sodienthoai || ''}</span>
              </div>
              <div>
                <span className="text-gray-500">Phường/Xã:</span>
                <span className="ml-2 font-medium">{orderDetail.diaChi.phuong || orderDetail.diaChi.phuongxa || ''}</span>
              </div>
              <div>
                <span className="text-gray-500">Tỉnh/TP:</span>
                <span className="ml-2 font-medium">{orderDetail.diaChi.tinh || orderDetail.diaChi.tinhtp || ''}</span>
              </div>
              <div>
                <span className="text-gray-500">Địa chỉ cụ thể:</span>
                <span className="ml-2 font-medium">{orderDetail.diaChi.diachicuthe || orderDetail.diaChi.vf4 || ''}</span>
              </div>
              {orderDetail.diaChi.diachi && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-gray-500">Địa chỉ đầy đủ:</span>
                  <div className="mt-1 text-gray-700">{orderDetail.diaChi.diachi}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products table + Tổng tiền đơn hàng */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between">
            <h3 className="font-semibold">Sản phẩm</h3>
            <div className="text-sm text-gray-500">
              Tổng tiền:&nbsp;
              <span className="text-xl font-bold text-red-600">
                {orderDetail.thanhTien ? formatPrice(orderDetail.thanhTien) : '0 ₫'}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-y">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">SẢN PHẨM</th>
                  <th className="px-6 py-3 text-left font-medium">PHÂN LOẠI</th>
                  <th className="px-6 py-3 text-right font-medium">ĐƠN GIÁ</th>
                  <th className="px-6 py-3 text-right font-medium">SỐ LƯỢNG</th>
                  <th className="px-6 py-3 text-right font-medium">THÀNH TIỀN</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(orderDetail.items) && orderDetail.items.length > 0 ? (
                  orderDetail.items.map((it, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {it.imageUrl && (
                            <img src={it.imageUrl} alt={it.productName} className="w-16 h-16 object-cover rounded border" />
                          )}
                          <div>
                            <div className="font-medium">{it.productName || ''}</div>
                            <div className="text-xs text-gray-500">Mã CTSP: {it.maChiTietSanPham}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          {it.variant?.color && <div>Màu: {it.variant.color}</div>}
                          {it.variant?.size && <div>Size: {it.variant.size}</div>}
                          {!it.variant?.color && !it.variant?.size && ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {it.donGia ? formatPrice(it.donGia) : ''}
                      </td>
                      <td className="px-6 py-4 text-right">{it.soLuong || 0}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {it.thanhTien ? formatPrice(it.thanhTien) : formatPrice((it.soLuong || 0) * (it.donGia || 0))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Không có sản phẩm</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return requested products */}
        {computedReturnLines.length > 0 && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="p-6 pb-4 flex items-center justify-between">
              <h3 className="font-semibold">Sản phẩm yêu cầu trả hàng</h3>
              <div className="text-sm text-gray-500">
                Tổng tiền yêu cầu trả: <span className="font-semibold text-red-600">{formatPrice(totalReturnAmount)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-y">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">SẢN PHẨM</th>
                    <th className="px-6 py-3 text-left font-medium">PHÂN LOẠI</th>
                    <th className="px-6 py-3 text-right font-medium">ĐƠN GIÁ</th>
                    <th className="px-6 py-3 text-right font-medium">SỐ LƯỢNG YÊU CẦU TRẢ</th>
                    <th className="px-6 py-3 text-right font-medium">THÀNH TIỀN</th>
                  </tr>
                </thead>
                <tbody>
                  {computedReturnLines.map((line, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {line.item.imageUrl && (
                            <img src={line.item.imageUrl} alt={line.item.productName} className="w-16 h-16 object-cover rounded border" />
                          )}
                          <div>
                            <div className="font-medium">{line.item.productName || ''}</div>
                            <div className="text-xs text-gray-500">Mã CTSP: {line.item.maChiTietSanPham}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          {line.item.variant?.color && <div>Màu: {line.item.variant.color}</div>}
                          {line.item.variant?.size && <div>Size: {line.item.variant.size}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{formatPrice(line.unitPrice || 0)}</td>
                      <td className="px-6 py-4 text-right">{line.quantity}</td>
                      <td className="px-6 py-4 text-right font-semibold">{formatPrice(line.amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          {/* Return reasons & evidence media (images / videos) */}
          {Array.isArray(returnItems) && returnItems.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Lý do & Minh chứng</h3>
              <div className="space-y-4">
                {returnItems.map((r) => {
                  const media = parseMedia(r.hinhAnhLoi || r.hinhanhloi || r.hinhAnh || r.hinhanh);
                  return (
                    <div key={r.id || r.maTraHang || `${r.maChiTietSanPham}-${r.ngayYeuCau}`} className="border rounded p-3">
                      <div className="text-sm text-gray-600">Phiếu: <span className="font-medium">{r.id || r.maTraHang || ''}</span> &nbsp; Mã CTSP: <span className="font-medium">{r.maChiTietSanPham || r.machitietsanpham || ''}</span></div>
                      <div className="mt-2">
                        <div className="text-sm text-gray-500">Lý do:</div>
                        <div className="mt-1 text-gray-800">{r.lyDo || r.lydo || r.lyDo || r.ly || ''}</div>
                      </div>
                      {media && media.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-500 mb-2">Minh chứng:</div>
                          <div className="flex flex-wrap gap-3">
                            {media.map((m, i) => {
                              const url = buildStorageUrl(m);
                              const lower = (m || '').toString().toLowerCase();
                              const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.includes('video');
                              return (
                                <div key={i} className="w-32 h-32 border rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                  {isVideo ? (
                                    <video src={url} controls className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={url} alt={`evidence-${i}`} className="w-full h-full object-cover" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* (Tổng tiền đã gộp vào header bảng Sản phẩm) */}
      </div>
    </div>
  );
}
