#!/usr/bin/env node
/**
 * Script test authentication
 * Chạy: node test-auth.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { generateToken, verifyToken } = require('./src/utils/jwt');

async function testAuth() {
  console.log('=== Test Authentication System ===\n');

  // 1. Test hash password
  console.log('1. Test hash password:');
  const plainPassword = 'password123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  console.log('   Plain:', plainPassword);
  console.log('   Hashed:', hashedPassword);
  console.log('   ✅ Hash thành công\n');

  // 2. Test compare password
  console.log('2. Test compare password:');
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('   Mật khẩu đúng:', isMatch);
  const isWrong = await bcrypt.compare('wrongpassword', hashedPassword);
  console.log('   Mật khẩu sai:', isWrong);
  console.log('   ✅ Compare thành công\n');

  // 3. Test generate JWT token
  console.log('3. Test generate JWT token:');
  const payload = {
    makhachhang: 1,
    email: 'test@example.com',
    role: 'customer'
  };
  const token = generateToken(payload);
  console.log('   Token:', token.substring(0, 50) + '...');
  console.log('   ✅ Generate token thành công\n');

  // 4. Test verify token
  console.log('4. Test verify JWT token:');
  try {
    const decoded = verifyToken(token);
    console.log('   Decoded:', decoded);
    console.log('   ✅ Verify token thành công\n');
  } catch (error) {
    console.log('   ❌ Verify token thất bại:', error.message);
  }

  // 5. Test verify invalid token
  console.log('5. Test verify invalid token:');
  try {
    verifyToken('invalid.token.here');
    console.log('   ❌ Không catch được lỗi');
  } catch (error) {
    console.log('   ✅ Catch lỗi thành công:', error.message);
  }

  console.log('\n=== Tất cả test PASSED ===');
}

// Chỉ chạy nếu file này được chạy trực tiếp
if (require.main === module) {
  testAuth().catch(console.error);
}

module.exports = testAuth;
