# Password Migration - Tự động chuyển đổi Plain Text sang Hashed

## 🎯 Vấn đề

Database hiện tại đang lưu mật khẩu dưới dạng **plain text** (không mã hóa), điều này rất **không an toàn**.

Ví dụ:
```
matkhau: "123456"          ❌ Plain text
matkhau: "$2a$10$abc..."   ✅ Bcrypt hashed
```

## ✅ Giải pháp: Auto-Migration

Hệ thống đã được cập nhật để **tự động hash mật khẩu** khi user login thành công:

### Flow hoạt động:

```
1. User đăng nhập với plain text password
   ↓
2. System kiểm tra password trong DB
   ↓
3. Nếu password là plain text:
   - So sánh trực tiếp (plainPassword === storedPassword)
   - Nếu đúng → Login thành công
   - Tự động hash password bằng bcrypt
   - Cập nhật lại vào database
   ↓
4. Lần login tiếp theo:
   - Password đã được hash
   - Sử dụng bcrypt.compare()
```

## 🔧 Cách hoạt động

### 1. Phát hiện Plain Text Password

Code tự động phát hiện dựa vào format của bcrypt hash:
```javascript
// Bcrypt hash luôn bắt đầu với $2a$, $2b$, hoặc $2y$
const isBcryptHash = password.startsWith('$2a$') || 
                     password.startsWith('$2b$') || 
                     password.startsWith('$2y$');
```

### 2. So sánh Password

```javascript
async comparePassword(plainPassword, storedPassword) {
  if (!isBcryptHash) {
    // Plain text - so sánh trực tiếp
    console.warn('⚠️ Plain text password detected');
    return plainPassword === storedPassword;
  }
  
  // Hashed - dùng bcrypt
  return await bcrypt.compare(plainPassword, storedPassword);
}
```

### 3. Auto-Migration khi Login

```javascript
// Sau khi verify password thành công
if (isPlainText) {
  console.log('🔄 Auto-migrating password...');
  const hashedPassword = await hashPassword(matkhau);
  await Repository.update(id, { matkhau: hashedPassword });
}
```

## 📊 Ưu điểm của giải pháp này

✅ **Không cần chạy script migration** - Tự động khi user login  
✅ **Không làm gián đoạn service** - Vẫn hoạt động với password cũ  
✅ **Dần dần migrate** - Mỗi lần user login, password được hash  
✅ **Backward compatible** - Hỗ trợ cả plain text và hashed  
✅ **Zero downtime** - Không cần dừng server  

## ⚠️ Lưu ý

### Console Warnings

Khi phát hiện plain text password, hệ thống sẽ log warning:
```
⚠️  WARNING: Plain text password detected. Please migrate to hashed passwords!
🔄 Auto-migrating password for employee: admina
```

### Users chưa login

Users chưa login lần nào sau khi deploy code mới sẽ **vẫn có plain text password**.

Để force migrate toàn bộ, có thể:
1. Chạy script migration (xem bên dưới)
2. Hoặc đợi user login tự nhiên

## 🔧 Optional: Script Migration thủ công

Nếu muốn migrate tất cả passwords ngay lập tức:

```javascript
// scripts/migrate-all-passwords.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateAllPasswords() {
  console.log('🔄 Starting password migration...\n');
  
  // Migrate khách hàng
  const { data: customers } = await supabase
    .from('taikhoankhachhang')
    .select('*');
  
  let migratedCount = 0;
  for (const customer of customers) {
    if (!customer.matkhau.startsWith('$2')) {
      const hashed = await bcrypt.hash(customer.matkhau, 10);
      await supabase
        .from('taikhoankhachhang')
        .update({ matkhau: hashed })
        .eq('makhachhang', customer.makhachhang);
      
      migratedCount++;
      console.log(`✅ Migrated customer: ${customer.email}`);
    }
  }
  
  // Migrate nhân viên
  const { data: employees } = await supabase
    .from('taikhoannhanvien')
    .select('*');
  
  for (const employee of employees) {
    if (!employee.matkhau.startsWith('$2')) {
      const hashed = await bcrypt.hash(employee.matkhau, 10);
      await supabase
        .from('taikhoannhanvien')
        .update({ matkhau: hashed })
        .eq('manhanvien', employee.manhanvien);
      
      migratedCount++;
      console.log(`✅ Migrated employee: ${employee.tendangnhap}`);
    }
  }
  
  console.log(`\n🎉 Migration complete! Total migrated: ${migratedCount}`);
}

migrateAllPasswords().catch(console.error);
```

Chạy script:
```bash
node scripts/migrate-all-passwords.js
```

## 🧪 Testing

### Test với plain text password:

```bash
# Login với password plain text lần đầu
curl -X POST http://localhost:3000/api/auth/login/employee \
  -H "Content-Type: application/json" \
  -d '{
    "tendangnhap": "admina",
    "matkhau": "123456"
  }'

# Check console log:
# ⚠️  WARNING: Plain text password detected...
# 🔄 Auto-migrating password for employee: admina

# Login lần 2 - password đã được hash
# Không còn warning nữa
```

### Kiểm tra trong database:

```sql
-- Trước migration
SELECT matkhau FROM taikhoannhanvien WHERE tendangnhap = 'admina';
-- Result: 123456

-- Sau migration (sau lần login đầu)
SELECT matkhau FROM taikhoannhanvien WHERE tendangnhap = 'admina';
-- Result: $2a$10$...
```

## 🔒 Security

### Tại sao cần hash password?

❌ **Plain text:**
- Admin có thể xem password của users
- Nếu database bị leak, hacker biết ngay password
- Vi phạm privacy của users

✅ **Hashed with bcrypt:**
- Admin không thể xem password gốc
- Nếu database bị leak, hacker không thể reverse hash
- Bảo vệ privacy của users
- Salt tự động (mỗi password có salt riêng)

### Bcrypt Properties:

- **One-way hash:** Không thể reverse
- **Salt:** Mỗi password có salt khác nhau
- **Cost factor:** 10 rounds (2^10 = 1024 iterations)
- **Slow by design:** Chống brute force

## 📝 Changelog

### Version 1.0 (2025-10-06)
- ✅ Thêm auto-detection plain text password
- ✅ Thêm auto-migration khi login
- ✅ Backward compatible với plain text
- ✅ Console warnings cho admin
- ✅ Áp dụng cho cả customer và employee

## 🎓 Best Practices

1. **Monitor logs** - Check console warnings để biết còn bao nhiêu plain text passwords
2. **Run migration script** - Nếu muốn migrate ngay lập tức
3. **Test thoroughly** - Test với cả plain text và hashed passwords
4. **Update documentation** - Thông báo cho team về thay đổi này

## ❓ FAQ

**Q: Có cần chạy migration script không?**  
A: Không bắt buộc. Passwords sẽ tự động migrate khi user login.

**Q: User cũ có cần đổi password không?**  
A: Không. Hệ thống tự động migrate khi họ login.

**Q: Plain text passwords còn hoạt động không?**  
A: Có. Backward compatible 100%.

**Q: Khi nào nên chạy manual migration?**  
A: Nếu muốn bảo mật ngay lập tức cho tất cả accounts, không đợi user login.

**Q: Password mới từ register có được hash không?**  
A: Có. Tất cả passwords mới đều tự động hash ngay từ đầu.
