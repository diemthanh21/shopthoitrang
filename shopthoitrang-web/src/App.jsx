import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import NhanVienPage from './pages/NhanVienPage';
import SanPhamPage from './pages/SanPhamPage';
import BannerPage from './pages/BannerPage';
import PhanCongCaPage from './pages/PhanCongCaPage';
import KhuyenMaiPage from './pages/KhuyenMaiPage';
import DonHangPage from './pages/DonHangPage';
import DonHangDetailPage from './pages/DonHangDetailPage';
import KhachHangPage from './pages/KhachHangPage';
import TheThanhVienPage from './pages/TheThanhVienPage';
import NhanVienDetailPage from "./pages/NhanVienDetailPage";
import NhanVienEditPage from "./pages/NhanVienEditPage";
import TinNhanPage from './pages/TinNhanPage';
import ThongBaoPage from './pages/ThongBaoPage';
import DanhGiaPage from './pages/DanhGiaPage';
import TraHangPage from './pages/TraHangPage';
import TraHangDetailPage from './pages/TraHangDetailPage';
import DoiHangPage from './pages/DoiHangPage';
import DoiHangDetailPage from './pages/DoiHangDetailPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
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
            <Route path="sanpham" element={<SanPhamPage />} />
            <Route path="banner" element={<BannerPage />} />
            <Route path="phancongca" element={<PhanCongCaPage />} />
            <Route path="khuyenmai" element={<KhuyenMaiPage />} />
            <Route path="donhang" element={<DonHangPage />} />
            <Route path="donhang/:id" element={<DonHangDetailPage />} />
            <Route path="trahang" element={<TraHangPage />} />
            <Route path="trahang/:id" element={<TraHangDetailPage />} />
            <Route path="doihang" element={<DoiHangPage />} />
            <Route path="doihang/:id" element={<DoiHangDetailPage />} />
            <Route path="khachhang" element={<KhachHangPage />} />
            <Route path="thethanhvien" element={<TheThanhVienPage />} />
            <Route path="tinnhan" element={<TinNhanPage />} />
            <Route path="danhgia" element={<DanhGiaPage />} />
            <Route path="thongbao" element={<ThongBaoPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
