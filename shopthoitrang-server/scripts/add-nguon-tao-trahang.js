require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addNguonTaoColumn() {
  console.log('🔧 Adding nguon_tao column to trahang table...\n');

  try {
    // 1. Kiểm tra xem cột đã tồn tại chưa
    const { data: columns, error: checkError } = await supabase
      .from('trahang')
      .select('*')
      .limit(1);

    if (checkError && !checkError.message.includes('nguon_tao')) {
      console.log('✅ Column nguon_tao already exists');
      return;
    }

    console.log('📝 Please run these SQL commands in Supabase SQL Editor:\n');
    console.log('-- 1. Add nguon_tao column');
    console.log("ALTER TABLE trahang ADD COLUMN IF NOT EXISTS nguon_tao VARCHAR(20) DEFAULT 'MOBILE';\n");
    
    console.log('-- 2. Update existing records created by staff (có manhanvien) to POS');
    console.log("UPDATE trahang SET nguon_tao = 'POS' WHERE manhanvien IS NOT NULL;\n");
    
    console.log('-- 3. Create index for faster queries');
    console.log('CREATE INDEX IF NOT EXISTS idx_trahang_nguon_tao ON trahang(nguon_tao);\n');
    
    console.log('-- 4. Verify the changes');
    console.log('SELECT nguon_tao, COUNT(*) as count FROM trahang GROUP BY nguon_tao;\n');

    console.log('⚠️  After running the SQL commands above, the migration will be complete.');
    console.log('   All existing records with manhanvien will be marked as POS.');
    console.log('   All other records will be marked as MOBILE (default).');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

addNguonTaoColumn()
  .then(() => {
    console.log('\n✨ Migration script completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
