/**
 * Script to create phieudathang_log table for notification system
 */
const supabase = require('../config/db');

async function createPhieuDatHangLogTable() {
  console.log('Creating phieudathang_log table...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS phieudathang_log (
      id SERIAL PRIMARY KEY,
      maphieudathang INTEGER NOT NULL REFERENCES phieudathang(maphieudathang) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      note TEXT,
      actor_type VARCHAR(50),
      actor_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  const createIndexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_phieudathang_log_maphieudathang ON phieudathang_log(maphieudathang);
    CREATE INDEX IF NOT EXISTS idx_phieudathang_log_created_at ON phieudathang_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_phieudathang_log_action ON phieudathang_log(action);
  `;
  
  try {
    // Verify table exists
    const { data, error } = await supabase.from('phieudathang_log').select('id').limit(1);
    
    if (error && error.code === '42P01') {
      console.error('❌ Table does not exist. Please run the following SQL manually in your Supabase SQL Editor:');
      console.log('\n' + createTableSQL);
      console.log('\n' + createIndexesSQL);
      process.exit(1);
    } else if (error) {
      console.error('❌ Error verifying table:', error.message);
    } else {
      console.log('✅ Table phieudathang_log already exists or created successfully');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('\n⚠️ Please run the migration manually:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Execute the SQL from CREATE_PHIEUDATHANG_LOG_TABLE.sql');
  }
}

createPhieuDatHangLogTable()
  .then(() => {
    console.log('\n✅ Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
