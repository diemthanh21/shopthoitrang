const { createClient } = require('./shopthoitrang-server/node_modules/@supabase/supabase-js');
require('./shopthoitrang-server/node_modules/dotenv/lib/main').config({ path: './shopthoitrang-server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkOrder269() {
  console.log('\n=== Kiểm tra Order #269 ===\n');

  // 1. Get order info
  const { data: order } = await supabase
    .from('donhang')
    .select('*')
    .eq('madonhang', 269)
    .single();

  console.log('Order info:', {
    madonhang: order.madonhang,
    thanhtien: order.thanhtien,
    phivanchuyen: order.phivanchuyen,
    magiamgia: order.magiamgia
  });

  // 2. Get voucher usage
  const { data: usage } = await supabase
    .from('magiamgia_sudung')
    .select('*')
    .eq('madonhang', 269);

  console.log('\n📋 Voucher usage records:', usage);

  if (usage && usage.length > 0) {
    const voucherIds = usage.map(u => u.mavoucher);
    
    // 3. Get voucher details (using mavoucher as primary key)
    const { data: vouchers, error: vErr } = await supabase
      .from('magiamgia')
      .select('*')
      .in('mavoucher', voucherIds);

    console.log('\n🏷️ Voucher details:');
    if (vouchers && vouchers.length > 0) {
      vouchers.forEach(v => {
        console.log(`\n- ${v.macode} (${v.tenmagiamgia})`);
        console.log(`  Mô tả: ${v.mota || 'N/A'}`);
        console.log(`  Loại: ${v.hinhthuc_giam}`);
        if (v.hinhthuc_giam === 'PERCENT') {
          console.log(`  Giảm: ${v.phantram_giam}% (tối đa ${v.giam_toi_da?.toLocaleString() || 'không giới hạn'} VND)`);
        } else if (v.hinhthuc_giam === 'AMOUNT') {
          console.log(`  Giảm: ${v.sotien_giam?.toLocaleString()} VND`);
        } else if (v.hinhthuc_giam === 'FREESHIP') {
          console.log(`  Freeship: tối đa ${v.giam_toi_da?.toLocaleString() || 'toàn bộ'} VND`);
        }
        console.log(`  Điều kiện: đơn tối thiểu ${v.dieukien_don_toi_thieu?.toLocaleString() || 0} VND`);
      });
    } else {
      console.log('⚠️ No vouchers found');
    }
  }

  // 4. Get order items to calculate subtotal
  const { data: items } = await supabase
    .from('chitietdonhang')
    .select('*')
    .eq('madonhang', 269);

  const subtotal = items.reduce((sum, item) => sum + (item.dongia * item.soluong), 0);
  
  console.log('\n💰 Tính toán:');
  console.log('- Subtotal:', subtotal.toLocaleString(), 'VND');
  console.log('- Phí ship:', order.phivanchuyen?.toLocaleString() || 0, 'VND');
  console.log('- Tổng thanh toán:', order.thanhtien?.toLocaleString(), 'VND');

  process.exit(0);
}

checkOrder269();
