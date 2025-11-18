require('dotenv').config(); 
// Set timezone cho toàn server
process.env.TZ = 'Asia/Ho_Chi_Minh';

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const expressOasGenerator = require('express-oas-generator');
const { swaggerUi, specs } = require('./src/swagger');

const app = express();

app.use(cors());
app.use(express.json());

// Swagger UI hiển thị file đã sinh tự động
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
app.set('supabase', supabase);

// Router

// Authentication routes (không cần token)
app.use('/api/auth', require('./src/routes/auth.route'));
app.use('/api/banner', require('./src/routes/banner.route'));
app.use('/api/calamviec', require('./src/routes/calamviec.route'));
app.use('/api/chatbox', require('./src/routes/chatbox.route'));
app.use('/api/chitietdonhang', require('./src/routes/chitietdonhang.route'));
app.use('/api/chitietphieudathang', require('./src/routes/chitietphieudathang.route'));
app.use('/api/chitietphieunhap', require('./src/routes/chitietphieunhap.route'));
app.use('/api/chitietsanpham', require('./src/routes/chitietsanpham.route'));
app.use('/api/chotca', require('./src/routes/chotca.route'));
app.use('/api/chucnang', require('./src/routes/chucnang.route'));
app.use('/api/ctbanner', require('./src/routes/ctbanner.route'));
app.use('/api/danhgia', require('./src/routes/danhgia.route'));
app.use('/api/danhmucsanpham', require('./src/routes/danhmucsanpham.route'));
app.use('/api/diachikhachhang', require('./src/routes/diachikhachhang.route'));
app.use('/api/doihang', require('./src/routes/doihang.route'));
app.use('/api/donhang', require('./src/routes/donhang.route'));
app.use('/api/hangthe', require('./src/routes/hangthe.route'));
app.use('/api/hinhanhsanpham', require('./src/routes/hinhanhsanpham.route'));
app.use('/api/huydonhang', require('./src/routes/huydonhang.route'));
app.use('/api/khuyenmai', require('./src/routes/khuyenmai.route'));
app.use('/api/lichsutimkiem', require('./src/routes/lichsutimkiem.route'));
app.use('/api/magiamgia', require('./src/routes/magiamgia.route'));
app.use('/api/nhacungcap', require('./src/routes/nhacungcap.route'));
app.use('/api/nhanvien', require('./src/routes/nhanvien.route'));
app.use('/api/noidungchat', require('./src/routes/noidungchat.route'));
// New consolidated chat endpoints (enhanced list, start, messages, send, read)
app.use('/api/chat', require('./src/routes/chat.route'));
app.use('/api/membership', require('./src/routes/membership.route'));
app.use('/api/loyalty', require('./src/routes/loyalty.route'));
app.use('/api/kichthuocs', require('./src/routes/kichthuoc.route'));
app.use('/api/phancongca', require('./src/routes/phancongca.route'));
app.use('/api/phieudathang', require('./src/routes/phieudathang.route'));
app.use('/api/phieunhapkho', require('./src/routes/phieunhapkho.route'));
app.use('/api/sanpham', require('./src/routes/sanpham.route'));
app.use('/api/taikhoankhachhang', require('./src/routes/taikhoankhachhang.route'));
app.use('/api/taikhoannhanvien', require('./src/routes/taikhoannhanvien.route'));
app.use('/api/thethanhvien', require('./src/routes/thethanhvien.route'));
app.use('/api/thuonghieu', require('./src/routes/thuonghieu.route'));
app.use('/api/tichluy_chitieu', require('./src/routes/tichluy_chitieu.route'));
app.use('/api/trahang', require('./src/routes/trahang.route'));
app.use('/api/dashboard', require('./src/routes/dashboard.route'));
app.use('/api/system-logs', require('./src/routes/systemlog.route'));



// ✨ Khởi tạo express-oas-generator (đặt sau khi khai báo route)
//expressOasGenerator.init(app, {}); // hoặc .handleResponses(app, {})

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
});
