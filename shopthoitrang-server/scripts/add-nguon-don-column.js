// Script to add nguon_don column to donhang table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addNguonDonColumn() {
  try {
    console.log('🔧 Adding nguon_don column to donhang table...');
    
    // Step 1: Add column (if not exists - handled by PostgreSQL)
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE donhang 
        ADD COLUMN IF NOT EXISTS nguon_don VARCHAR(20) DEFAULT 'MOBILE';
      `
    });
    
    if (alterError) {
      console.log('Note: Column may already exist or using direct SQL');
      console.log('Please run this SQL manually in your database:');
      console.log(`
        ALTER TABLE donhang 
        ADD COLUMN IF NOT EXISTS nguon_don VARCHAR(20) DEFAULT 'MOBILE';
      `);
    } else {
      console.log('✅ Column added successfully');
    }
    
    // Step 2: Update existing orders with employee
    console.log('📝 Updating existing orders with manhanvien to POS...');
    const { data: updatedOrders, error: updateError } = await supabase
      .from('donhang')
      .update({ nguon_don: 'POS' })
      .not('manhanvien', 'is', null)
      .select('madonhang, nguon_don');
    
    if (updateError) {
      console.error('❌ Error updating orders:', updateError);
    } else {
      console.log(`✅ Updated ${updatedOrders?.length || 0} orders to POS`);
    }
    
    // Step 3: Verify
    console.log('🔍 Verifying recent orders...');
    const { data: recentOrders, error: verifyError } = await supabase
      .from('donhang')
      .select('madonhang, manhanvien, nguon_don, trangthaidonhang')
      .order('madonhang', { ascending: false })
      .limit(10);
    
    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
    } else {
      console.log('Recent orders:');
      console.table(recentOrders);
    }
    
    console.log('✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addNguonDonColumn();
