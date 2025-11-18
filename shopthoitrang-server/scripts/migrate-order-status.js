const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateOrderStatus() {
  console.log('🔄 Starting order status migration...');

  try {
    // 1. Update "Đang xử lý" to "Chờ xác nhận"
    console.log('\n📝 Updating "Đang xử lý" → "Chờ xác nhận"...');
    const { data: data1, error: error1 } = await supabase
      .from('donhang')
      .update({ trangthaidonhang: 'Chờ xác nhận' })
      .eq('trangthaidonhang', 'Đang xử lý')
      .select();

    if (error1) {
      console.error('❌ Error updating "Đang xử lý":', error1);
    } else {
      console.log(`✅ Updated ${data1?.length || 0} orders from "Đang xử lý" to "Chờ xác nhận"`);
    }

    // 2. Update "Hoàn thành" to "Đã giao"
    console.log('\n📝 Updating "Hoàn thành" → "Đã giao"...');
    const { data: data2, error: error2 } = await supabase
      .from('donhang')
      .update({ trangthaidonhang: 'Đã giao' })
      .eq('trangthaidonhang', 'Hoàn thành')
      .select();

    if (error2) {
      console.error('❌ Error updating "Hoàn thành":', error2);
    } else {
      console.log(`✅ Updated ${data2?.length || 0} orders from "Hoàn thành" to "Đã giao"`);
    }

    // 3. Update "Đã huỷ" / "Hủy" to "Đã hủy"
    console.log('\n📝 Updating variations of "Hủy" → "Đã hủy"...');
    const { data: data3, error: error3 } = await supabase
      .from('donhang')
      .update({ trangthaidonhang: 'Đã hủy' })
      .in('trangthaidonhang', ['Đã huỷ', 'Hủy', 'hủy'])
      .select();

    if (error3) {
      console.error('❌ Error updating cancel variations:', error3);
    } else {
      console.log(`✅ Updated ${data3?.length || 0} orders to "Đã hủy"`);
    }

    // 4. Show summary
    console.log('\n📊 Final status summary:');
    const { data: summary, error: summaryError } = await supabase
      .from('donhang')
      .select('trangthaidonhang')
      .neq('trangthaidonhang', 'cart');

    if (!summaryError && summary) {
      const counts = {};
      summary.forEach(order => {
        const status = order.trangthaidonhang;
        counts[status] = (counts[status] || 0) + 1;
      });

      Object.entries(counts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count} orders`);
      });
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateOrderStatus();
