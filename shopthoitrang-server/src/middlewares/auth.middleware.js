// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader)
      return res.status(401).json({ message: 'Thiếu header Authorization.' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
      return res.status(400).json({ message: 'Sai định dạng token. Dạng đúng: Bearer <token>' });

    const token = parts[1];

    if (!JWT_SECRET)
      return res.status(500).json({ message: 'Thiếu cấu hình JWT_SECRET trong môi trường.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token đã hết hạn.' });
        }
        return res.status(403).json({ message: 'Token không hợp lệ.' });
      }

      req.user = user; // Lưu user info (payload) vào request
      next();
    });
  } catch (error) {
    console.error('Lỗi khi xác thực token:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi xác thực token.' });
  }
}

module.exports = authenticateToken;
