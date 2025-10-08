require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
  console.log('Testing table counts...');
  
  const tables = ['donhang', 'sanpham', 'taikhoankhachhang'];
  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    } catch (e) {
      console.log(`💥 ${table}: ${e.message}`);
    }
  }
  
  // Test specific taikhoankhachhang query
  console.log('\nTesting taikhoankhachhang direct query:');
  try {
    const { data, error } = await supabase.from('taikhoankhachhang').select('*').limit(5);
    if (error) {
      console.log(`❌ Query error: ${error.message}`);
    } else {
      console.log(`✅ Retrieved ${data?.length || 0} records`);
      if (data?.length > 0) {
        console.log('Sample record keys:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.log(`💥 Query failed: ${e.message}`);
  }
}

test().then(() => process.exit());