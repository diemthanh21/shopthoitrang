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
            <Route path="sanpham" element={<SanPhamPage />} />
            <Route path="banner" element={<BannerPage />} />
            <Route path="phancongca" element={<PhanCongCaPage />} />
            <Route path="khuyenmai" element={<KhuyenMaiPage />} />
            <Route path="donhang" element={<DonHangPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
