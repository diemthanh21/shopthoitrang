#!/usr/bin/env node
/**
 * Script migration tất cả plain text passwords sang bcrypt hash
 * 
 * CẢNH BÁO: Chỉ chạy script này 1 LẦN DUY NHẤT!
 * Nếu chạy lại sẽ hash mật khẩu đã hash → làm hỏng passwords
 * 
 * Cách chạy:
 * node scripts/migrate-all-passwords.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALT_ROUNDS = 10;

/**
 * Kiểm tra xem password đã được hash chưa
 */
function isAlreadyHashed(password) {
  if (!password) return false;
  return password.startsWith('$2a$') || 
         password.startsWith('$2b$') || 
         password.startsWith('$2y$');
}

/**
 * Migrate passwords cho bảng taikhoankhachhang
 */
async function migrateCustomerPasswords() {
  console.log('\n📋 Migrating customer passwords...');
  
  const { data: customers, error } = await supabase
    .from('taikhoankhachhang')
    .select('makhachhang, email, matkhau');
  
  if (error) {
    console.error('❌ Error fetching customers:', error);
    return 0;
  }

  let migratedCount = 0;
  let skippedCount = 0;

  for (const customer of customers) {
    if (isAlreadyHashed(customer.matkhau)) {
      console.log(`⏭️  Skipped (already hashed): ${customer.email}`);
      skippedCount++;
      continue;
    }

    try {
      const hashedPassword = await bcrypt.hash(customer.matkhau, SALT_ROUNDS);
      
      const { error: updateError } = await supabase
        .from('taikhoankhachhang')
        .update({ matkhau: hashedPassword })
        .eq('makhachhang', customer.makhachhang);

      if (updateError) {
        console.error(`❌ Error updating ${customer.email}:`, updateError);
      } else {
        console.log(`✅ Migrated: ${customer.email}`);
        migratedCount++;
      }
    } catch (err) {
      console.error(`❌ Error hashing password for ${customer.email}:`, err);
    }
  }

  console.log(`\n📊 Customer passwords: ${migratedCount} migrated, ${skippedCount} skipped`);
  return migratedCount;
}

/**
 * Migrate passwords cho bảng taikhoannhanvien
 */
async function migrateEmployeePasswords() {
  console.log('\n📋 Migrating employee passwords...');
  
  const { data: employees, error } = await supabase
    .from('taikhoannhanvien')
    .select('manhanvien, tendangnhap, matkhau');
  
  if (error) {
    console.error('❌ Error fetching employees:', error);
    return 0;
  }

  let migratedCount = 0;
  let skippedCount = 0;

  for (const employee of employees) {
    if (isAlreadyHashed(employee.matkhau)) {
      console.log(`⏭️  Skipped (already hashed): ${employee.tendangnhap}`);
      skippedCount++;
      continue;
    }

    try {
      const hashedPassword = await bcrypt.hash(employee.matkhau, SALT_ROUNDS);
      
      const { error: updateError } = await supabase
        .from('taikhoannhanvien')
        .update({ matkhau: hashedPassword })
        .eq('manhanvien', employee.manhanvien);

      if (updateError) {
        console.error(`❌ Error updating ${employee.tendangnhap}:`, updateError);
      } else {
        console.log(`✅ Migrated: ${employee.tendangnhap}`);
        migratedCount++;
      }
    } catch (err) {
      console.error(`❌ Error hashing password for ${employee.tendangnhap}:`, err);
    }
  }

  console.log(`\n📊 Employee passwords: ${migratedCount} migrated, ${skippedCount} skipped`);
  return migratedCount;
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   PASSWORD MIGRATION: Plain Text → Bcrypt Hash    ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  // Confirm before running
  console.log('\n⚠️  WARNING: This will hash all plain text passwords!');
  console.log('⚠️  Make sure to backup your database first!');
  console.log('⚠️  Only run this script ONCE!\n');

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
  }

  try {
    // Migrate customers
    const customersCount = await migrateCustomerPasswords();
    
    // Migrate employees
    const employeesCount = await migrateEmployeePasswords();
    
    // Summary
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║              MIGRATION COMPLETE!                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`\n✅ Total migrated: ${customersCount + employeesCount} passwords`);
    console.log(`   - Customers: ${customersCount}`);
    console.log(`   - Employees: ${employeesCount}`);
    console.log('\n🎉 All passwords are now securely hashed!');
    console.log('🔒 Plain text passwords have been replaced with bcrypt hashes.\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };
