/**
 * Script to create phieunhapkho_log table for notification system
 */
const supabase = require('../config/db');

async function createPhieuNhapKhoLogTable() {
  console.log('Creating phieunhapkho_log table...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS phieunhapkho_log (
      id SERIAL PRIMARY KEY,
      maphieunhapkho INTEGER NOT NULL REFERENCES phieunhapkho(maphieunhapkho) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      note TEXT,
      actor_type VARCHAR(50),
      actor_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  const createIndexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_phieunhapkho_log_maphieunhapkho ON phieunhapkho_log(maphieunhapkho);
    CREATE INDEX IF NOT EXISTS idx_phieunhapkho_log_created_at ON phieunhapkho_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_phieunhapkho_log_action ON phieunhapkho_log(action);
  `;
  
  try {
    // Verify table exists
    const { data, error } = await supabase.from('phieunhapkho_log').select('id').limit(1);
    
    if (error && error.code === '42P01') {
      console.error('❌ Table does not exist. Please run the following SQL manually in your Supabase SQL Editor:');
      console.log('\n' + createTableSQL);
      console.log('\n' + createIndexesSQL);
      process.exit(1);
    } else if (error) {
      console.error('❌ Error verifying table:', error.message);
    } else {
      console.log('✅ Table phieunhapkho_log already exists or created successfully');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('\n⚠️ Please run the migration manually:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Execute the SQL from CREATE_PHIEUNHAPKHO_LOG_TABLE.sql');
  }
}

createPhieuNhapKhoLogTable()
  .then(() => {
    console.log('\n✅ Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
