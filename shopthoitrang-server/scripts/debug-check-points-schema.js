require('dotenv').config();
const supabase = require('../config/db');

async function main(){
  console.log('Checking schema...');
  try{
    const a = await supabase.from('thethanhvien').select('*').limit(1);
    console.log('thethanhvien:', a.data ? 'OK' : a.error);
  }catch(e){ console.log('thethanhvien error', e); }
  try{
    const b = await supabase.from('thethanhvien_point_transactions').select('*').limit(1);
    console.log('thethanhvien_point_transactions:', b.error ? b.error : 'OK');
  }catch(e){ console.log('tx error', e); }
  try{
    const c = await supabase.from('thethanhvien_point_ledger').select('*').limit(1);
    console.log('thethanhvien_point_ledger:', c.error ? c.error : 'OK');
  }catch(e){ console.log('ledger error', e); }
}
main();