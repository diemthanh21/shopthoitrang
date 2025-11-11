// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import nhanvienService from "../services/nhanvienService";
import chucnangService from "../services/chucnangService";

const AuthContext = createContext(null);

// Chuẩn hoá user từ backend -> camelCase
const normalizeBaseUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    maNhanVien:
      u.maNhanVien ??
      u.manhanvien ??
      u.MANHANVIEN ??
      null,
    tenDangNhap:
      u.tenDangNhap ??
      u.tendangnhap ??
      u.TENDANGNHAP ??
      u.username ??
      "",
    maQuyen:
      u.maQuyen ??
      u.maquyen ??
      u.MAQUYEN ??
      null,
  };
};

// Lấy thêm thông tin NV + chức năng
const enrichUser = async (rawUser) => {
  if (!rawUser) return null;
  const baseUser = normalizeBaseUser(rawUser);

  let hoTen = baseUser.hoTen ?? null;
  let maChucNang = baseUser.maChucNang ?? null;
  let chucVu = baseUser.chucVu ?? null;
  let maQuyen = baseUser.maQuyen ?? null;

  try {
    if (baseUser.maNhanVien) {
      const nv = await nhanvienService.getById(baseUser.maNhanVien);
      hoTen = nv.hoTen ?? hoTen;
      maChucNang = nv.maChucNang ?? maChucNang;

      if (maChucNang) {
        const cn = await chucnangService.getById(maChucNang);
        chucVu = cn.tenChucNang ?? chucVu;
        maQuyen = cn.maQuyen ?? maQuyen;   // <-- LẤY MÃ QUYỀN Ở ĐÂY
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[AuthContext] enrichUser error", e);
  }

  return {
    ...baseUser,
    hoTen,
    maChucNang,
    chucVu,
    maQuyen,            // <-- LƯU VÀO user
  };
};
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Khởi tạo từ localStorage / authService
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[AuthContext] init");

    const init = async () => {
      try {
        const existingToken = authService.getToken();
        const existingUser = authService.getCurrentUser();

        if (existingToken && existingUser) {
          setToken(existingToken);
          const fullUser = await enrichUser(existingUser);
          setUser(fullUser);
          // eslint-disable-next-line no-console
          console.log("[AuthContext] restored user", fullUser);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[AuthContext] error parsing user", e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const { token: tk, user: usr } = await authService.login(
        username,
        password
      );

      // eslint-disable-next-line no-console
      console.log("[AuthContext] login raw user", usr);

      setToken(tk);

      const fullUser = await enrichUser(usr);
      setUser(fullUser);

      // eslint-disable-next-line no-console
      console.log("[AuthContext] login full user", fullUser);

      return { success: true };
    } catch (e) {
      const message = e.message || "Đăng nhập thất bại";
      // eslint-disable-next-line no-console
      console.error("[AuthContext] login fail", message);
      setError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    authError: error,
    loading,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading && <div style={{ padding: 24 }}>Đang khởi tạo phiên...</div>}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
