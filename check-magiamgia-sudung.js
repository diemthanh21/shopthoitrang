const { createClient } = require('./shopthoitrang-server/node_modules/@supabase/supabase-js');
require('./shopthoitrang-server/node_modules/dotenv/lib/main').config({ path: './shopthoitrang-server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkTable() {
  console.log('\n=== Checking magiamgia_sudung structure ===\n');

  // Get table structure
  const { data, error } = await supabase
    .from('magiamgia_sudung')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample record:', data);
  }

  // Try to get column info by describing the table
  const { data: records } = await supabase
    .from('magiamgia_sudung')
    .select('*')
    .order('ngay_su_dung', { ascending: false })
    .limit(5);

  console.log('\nRecent records:');
  console.table(records);

  process.exit(0);
}

checkTable();
