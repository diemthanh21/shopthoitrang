/**
 * Script to create chotca_log table for notification system
 */
const supabase = require('../config/db');

async function createChotCaLogTable() {
  console.log('Creating chotca_log table...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS chotca_log (
      id SERIAL PRIMARY KEY,
      machotca INTEGER NOT NULL REFERENCES chotca(machotca) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      note TEXT,
      actor_type VARCHAR(50),
      actor_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  const createIndexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_chotca_log_machotca ON chotca_log(machotca);
    CREATE INDEX IF NOT EXISTS idx_chotca_log_created_at ON chotca_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chotca_log_action ON chotca_log(action);
  `;
  
  try {
    // Create table
    const { error: tableError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });
    
    if (tableError) {
      // If RPC doesn't exist, try direct SQL execution
      console.log('Using direct table creation...');
      const { error: directError } = await supabase.from('chotca_log').select('id').limit(1);
      
      if (directError && directError.code === '42P01') {
        console.error('❌ Table does not exist and cannot be created automatically.');
        console.error('Please run the following SQL manually in your Supabase SQL Editor:');
        console.log('\n' + createTableSQL);
        console.log('\n' + createIndexesSQL);
        process.exit(1);
      }
    }
    
    console.log('✅ Table chotca_log created successfully');
    
    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql: createIndexesSQL 
    });
    
    if (!indexError) {
      console.log('✅ Indexes created successfully');
    }
    
    // Verify table exists
    const { data, error } = await supabase.from('chotca_log').select('id').limit(1);
    
    if (error) {
      console.error('❌ Error verifying table:', error.message);
      console.log('\n⚠️ Please create the table manually using the SQL script in CREATE_CHOTCA_LOG_TABLE.sql');
    } else {
      console.log('✅ Table verification successful');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('\n⚠️ Please run the migration manually:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Execute the SQL from CREATE_CHOTCA_LOG_TABLE.sql');
  }
}

createChotCaLogTable()
  .then(() => {
    console.log('\n✅ Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
