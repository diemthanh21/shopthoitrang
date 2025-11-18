const supabase = require('../../config/db');

function extractRole(record) {
  if (!record) return null;
  return (
    record.maquyen ||
    record.role ||
    record.quyen ||
    record.vaitro ||
    null
  );
}

// authorizeRoles('ADMIN','MANAGER')
function authorizeRoles(...allowed) {
  const ALLOWED = new Set(allowed);
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Chưa đăng nhập' });

      // Chỉ cho nhân viên có quyền phù hợp
      const empId = req.user.manhanvien || req.user.maNhanVien;
      if (!empId) return res.status(403).json({ message: 'Chỉ nhân viên được phép truy cập' });

      // 1) Lấy tài khoản nhân viên
      const { data: nvAcc, error: errAcc } = await supabase
        .from('taikhoannhanvien')
        .select('*')
        .eq('manhanvien', empId)
        .maybeSingle();
      if (errAcc) {
        // eslint-disable-next-line no-console
        console.error('[authorizeRoles] Supabase error nvAcc', errAcc.message);
        return res.status(500).json({ message: 'Không thể kiểm tra quyền truy cập' });
      }
      let role = extractRole(nvAcc);

      // 2) Nếu chưa có maquyen trong tài khoản, join sang nhanvien -> chucnang
      if (!role) {
        const { data: nv, error: errNv } = await supabase
          .from('nhanvien')
          .select('machucnang')
          .eq('manhanvien', empId)
          .maybeSingle();
        if (errNv) {
          // eslint-disable-next-line no-console
          console.error('[authorizeRoles] Supabase error nv', errNv.message);
          return res.status(500).json({ message: 'Không thể kiểm tra quyền truy cập' });
        }
        const maChucNang = nv?.machucnang;
        if (maChucNang) {
          const { data: cn, error: errCn } = await supabase
            .from('chucnang')
            .select('maquyen')
            .eq('machucnang', maChucNang)
            .maybeSingle();
          if (errCn) {
            // eslint-disable-next-line no-console
            console.error('[authorizeRoles] Supabase error cn', errCn.message);
            return res.status(500).json({ message: 'Không thể kiểm tra quyền truy cập' });
          }
          role = extractRole(cn);
        }
      }

      if (!role || !ALLOWED.has(String(role).toUpperCase())) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập nội dung này' });
      }
      return next();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[authorizeRoles] error', e);
      return res.status(500).json({ message: 'Lỗi kiểm tra quyền' });
    }
  };
}

module.exports = authorizeRoles;
