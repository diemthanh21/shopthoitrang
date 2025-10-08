/**
 * Middleware kiểm tra user có role cụ thể
 * Sử dụng sau middleware authenticateToken
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      const user = req.user; // Đã được set bởi authenticateToken

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập'
        });
      }

      const userRole = user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền thực hiện hành động này'
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireRole:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra quyền'
      });
    }
  };
}

/**
 * Middleware kiểm tra user là nhân viên
 */
function requireEmployee(req, res, next) {
  return requireRole('employee')(req, res, next);
}

/**
 * Middleware kiểm tra user là khách hàng
 */
function requireCustomer(req, res, next) {
  return requireRole('customer')(req, res, next);
}

/**
 * Middleware cho phép cả nhân viên và khách hàng
 */
function requireAuthenticated(req, res, next) {
  return requireRole('employee', 'customer')(req, res, next);
}

module.exports = {
  requireRole,
  requireEmployee,
  requireCustomer,
  requireAuthenticated
};
