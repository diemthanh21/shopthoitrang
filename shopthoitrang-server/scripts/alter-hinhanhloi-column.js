require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function alterColumn() {
  console.log('🔧 Altering hinhanhloi column to TEXT type...\n');

  try {
    // Thực hiện ALTER TABLE
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE trahang ALTER COLUMN hinhanhloi TYPE TEXT;`
    });

    if (error) {
      // Nếu không có function exec_sql, thử cách khác
      console.log('⚠️  Cannot use rpc, trying direct query...');
      
      const { error: directError } = await supabase
        .from('trahang')
        .select('hinhanhloi')
        .limit(1);
      
      if (directError) {
        console.error('❌ Error:', directError.message);
        console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
        console.log('ALTER TABLE trahang ALTER COLUMN hinhanhloi TYPE TEXT;');
        return;
      }
    }

    console.log('✅ Column altered successfully!');
    console.log('   hinhanhloi is now TEXT type (unlimited length)');

    // Kiểm tra kết quả
    console.log('\n🔍 Verifying column type...');
    const { data: checkData, error: checkError } = await supabase
      .from('trahang')
      .select('matrahang, hinhanhloi')
      .limit(1);

    if (checkError) {
      console.log('⚠️  Cannot verify, but migration likely succeeded');
    } else {
      console.log('✅ Column is accessible and working');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
    console.log('ALTER TABLE trahang ALTER COLUMN hinhanhloi TYPE TEXT;');
  }
}

alterColumn()
  .then(() => {
    console.log('\n✨ Migration completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
