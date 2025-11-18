import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import BannerPage from './pages/BannerPage';
import CaLamViecPage from './pages/CaLamViecPage';
import ChiTietPhieuDatHangPage from './pages/ChiTietPhieuDatHangPage';
import ChiTietPhieuNhapKhoPage from './pages/ChiTietPhieuNhapKhoPage';
import DanhGiaPage from './pages/DanhGiaPage';
import DanhMucPage from './pages/DanhMucPage';
import Dashboard from './pages/Dashboard';
import DoiHangDetailPage from './pages/DoiHangDetailPage';
import DoiHangPage from './pages/DoiHangPage';
import DonHangDetailPage from './pages/DonHangDetailPage';
import DonHangPage from './pages/DonHangPage';
import HangThePage from './pages/HangThePage';
import KhachHangPage from './pages/KhachHangPage';
import KhuyenMaiPage from './pages/KhuyenMaiPage';
import NhaCungCapPage from './pages/NhaCungCapPage';
import NhanVienDetailPage from './pages/NhanVienDetailPage';
import NhanVienEditPage from './pages/NhanVienEditPage';
import NhanVienPage from './pages/NhanVienPage';
import PhanCongCaPage from './pages/PhanCongCaPage';
import PhieuDatHangPage from './pages/PhieuDatHangPage';
import PhieuNhapKhoPage from './pages/PhieuNhapKhoPage';
import SanPhamDetailPage from './pages/SanPhamDetailPage';
import SanPhamPage from './pages/SanPhamPage';
import TaiKhoanNhanVienPage from './pages/TaiKhoanNhanVienPage';
import TheThanhVienPage from './pages/TheThanhVienPage';
import ThongBaoPage from './pages/ThongBaoPage';
import TinNhanPage from './pages/TinNhanPage';
import TraHangDetailPage from './pages/TraHangDetailPage';
import TraHangPage from './pages/TraHangPage';
import VoucherGiamGiaPage from './pages/VoucherGiamGiaPage';
import KichThuocPage from './pages/KichThuocPage';
import ChotCaPage from './pages/ChotCaPage';
import ChotCaDetailPage from './pages/ChotCaDetailPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="nhanvien" element={<NhanVienPage />} />
            <Route path="nhanvien/:id" element={<NhanVienDetailPage />} />
            <Route path="nhanvien/:id/edit" element={<NhanVienEditPage />} />
            <Route path="taikhoannhanvien" element={<TaiKhoanNhanVienPage />} />
            <Route path="sanpham" element={<SanPhamPage />} />
            <Route path="sanpham/:id" element={<SanPhamDetailPage />} />
            <Route path="kichthuoc" element={<KichThuocPage />} />
            <Route path="banner" element={<BannerPage />} />
            <Route path="phancongca" element={<PhanCongCaPage />} />
            <Route path="khuyenmai" element={<KhuyenMaiPage />} />
            <Route path="vouchergiamgia" element={<VoucherGiamGiaPage />} />
            <Route path="donhang" element={<DonHangPage />} />
            <Route path="donhang/:id" element={<DonHangDetailPage />} />
            <Route path="phieudathang" element={<PhieuDatHangPage />} />
            <Route path="phieudathang/:id" element={<ChiTietPhieuDatHangPage />} />
            <Route path="phieunhapkho" element={<PhieuNhapKhoPage />} />
            <Route path="phieunhapkho/:id" element={<ChiTietPhieuNhapKhoPage />} />
            <Route path="trahang" element={<TraHangPage />} />
            <Route path="trahang/:id" element={<TraHangDetailPage />} />
            <Route path="doihang" element={<DoiHangPage />} />
            <Route path="doihang/:id" element={<DoiHangDetailPage />} />
            <Route path="khachhang" element={<KhachHangPage />} />
            <Route path="hangthe" element={<HangThePage />} />
            <Route path="thethanhvien" element={<TheThanhVienPage />} />
            <Route path="danhmuc" element={<DanhMucPage />} />
            <Route path="nhacungcap" element={<NhaCungCapPage />} />
            <Route path="calamviec" element={<CaLamViecPage />} />
            <Route path="tinnhan" element={<TinNhanPage />} />
            <Route path="danhgia" element={<DanhGiaPage />} />
            <Route path="thongbao" element={<ThongBaoPage />} />
            <Route path="chotca" element={<ChotCaPage />} />  
            <Route path="chotca/:id" element={<ChotCaDetailPage />} />  
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;