require('dotenv').config(); 
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
  process.env.SUPABASE_KEY
);
app.set('supabase', supabase);

// Router
app.use('/api/taikhoannhanvien', require('./src/routes/taikhoannhanvien.route'));
app.use('/api/nhanvien', require('./src/routes/nhanvien.route'));

// ✨ Khởi tạo express-oas-generator (đặt sau khi khai báo route)
//expressOasGenerator.init(app, {}); // hoặc .handleResponses(app, {})

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
});
