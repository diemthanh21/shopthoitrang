const { createClient } = require('./shopthoitrang-server/node_modules/@supabase/supabase-js');
require('./shopthoitrang-server/node_modules/dotenv/lib/main').config({ path: './shopthoitrang-server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setupDiscountUsageTable() {
  console.log('\n=== Setting up magiamgia_sudung table ===\n');

  try {
    // 1. Check if table exists
    console.log('1. Checking if table exists...');
    const { data: existingData, error: checkErr } = await supabase
      .from('magiamgia_sudung')
      .select('id')
      .limit(1);
      
    if (checkErr && checkErr.code === '42P01') {
      console.log('❌ Table does not exist. Creating...');
      
      // Create table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.magiamgia_sudung (
          id SERIAL PRIMARY KEY,
          magiamgia VARCHAR(50) NOT NULL,
          makhachhang INTEGER NOT NULL,
          madonhang INTEGER NOT NULL,
          ngaysudung TIMESTAMPTZ DEFAULT NOW(),
          sotiengiamgia DECIMAL(15, 2) DEFAULT 0,
          CONSTRAINT unique_order_coupon UNIQUE (madonhang, magiamgia)
        );
        
        CREATE INDEX IF NOT EXISTS idx_magiamgia_sudung_magiamgia ON public.magiamgia_sudung(magiamgia);
        CREATE INDEX IF NOT EXISTS idx_magiamgia_sudung_makhachhang ON public.magiamgia_sudung(makhachhang);
        CREATE INDEX IF NOT EXISTS idx_magiamgia_sudung_madonhang ON public.magiamgia_sudung(madonhang);
        CREATE INDEX IF NOT EXISTS idx_magiamgia_sudung_ngaysudung ON public.magiamgia_sudung(ngaysudung);
      `;
      
      const { error: createErr } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createErr) {
        console.error('❌ Failed to create table:', createErr);
        console.log('\n⚠️ Please run this SQL manually in Supabase SQL Editor:');
        console.log('\n' + createTableSQL);
      } else {
        console.log('✅ Table created successfully');
      }
    } else if (checkErr) {
      console.error('❌ Error checking table:', checkErr);
    } else {
      console.log('✅ Table already exists');
    }
    
    // 2. Check donhang.magiamgia column
    console.log('\n2. Checking donhang.magiamgia column...');
    const { data: donhangData, error: donhangErr } = await supabase
      .from('donhang')
      .select('madonhang, magiamgia')
      .limit(1);
      
    if (donhangErr && donhangErr.message.includes('magiamgia')) {
      console.log('❌ Column donhang.magiamgia does not exist');
      console.log('\n⚠️ Please run this SQL manually in Supabase SQL Editor:');
      console.log(`
        ALTER TABLE public.donhang ADD COLUMN IF NOT EXISTS magiamgia TEXT;
        CREATE INDEX IF NOT EXISTS idx_donhang_magiamgia ON public.donhang(magiamgia);
      `);
    } else {
      console.log('✅ Column donhang.magiamgia exists');
    }
    
    // 3. Test insert into magiamgia_sudung
    console.log('\n3. Testing insert into magiamgia_sudung...');
    const testRecord = {
      magiamgia: 'TEST2025',
      makhachhang: 11,
      madonhang: 999999, // fake order ID for testing
      ngaysudung: new Date().toISOString(),
      sotiengiamgia: 10000,
    };
    
    const { data: insertData, error: insertErr } = await supabase
      .from('magiamgia_sudung')
      .insert([testRecord])
      .select();
      
    if (insertErr) {
      console.error('❌ Test insert failed:', insertErr.message);
      if (insertErr.code === '23503') {
        console.log('⚠️ Foreign key constraint error. This is expected for test data.');
      }
    } else {
      console.log('✅ Test insert successful:', insertData);
      
      // Clean up test record
      await supabase
        .from('magiamgia_sudung')
        .delete()
        .eq('madonhang', 999999);
      console.log('✅ Test record cleaned up');
    }
    
    // 4. Show existing records
    console.log('\n4. Existing records in magiamgia_sudung:');
    const { data: records, error: selectErr } = await supabase
      .from('magiamgia_sudung')
      .select('*')
      .order('ngaysudung', { ascending: false })
      .limit(10);
      
    if (selectErr) {
      console.error('❌ Error fetching records:', selectErr.message);
    } else {
      console.log(`Found ${records?.length || 0} records:`);
      if (records && records.length > 0) {
        console.table(records);
      } else {
        console.log('(No records yet)');
      }
    }
    
  } catch (err) {
    console.error('❌ Setup failed:', err);
  }
  
  process.exit(0);
}

setupDiscountUsageTable();
