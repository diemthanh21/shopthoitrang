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
import KhachHangPage from './pages/KhachHangPage';
import NhanVienDetailPage from "./pages/NhanVienDetailPage";
import NhanVienEditPage from "./pages/NhanVienEditPage";
import HangThePage from './pages/HangThePage';
import DanhMucPage from './pages/DanhMucPage';

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
            <Route path="khachhang" element={<KhachHangPage />} />
            <Route path="hangthe" element={<HangThePage />} />
            <Route path="danhmuc" element={<DanhMucPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
