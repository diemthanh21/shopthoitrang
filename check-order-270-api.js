const { createClient } = require('./shopthoitrang-server/node_modules/@supabase/supabase-js');
require('./shopthoitrang-server/node_modules/dotenv').config({ path: './shopthoitrang-server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrder270() {
  console.log('\n=== Test API Response cho Order #270 ===\n');
  
  // Simulate what the API returns
  const orderId = 270;
  
  // Get order
  const { data: order } = await supabase
    .from('donhang')
    .select('*')
    .eq('madonhang', orderId)
    .single();
    
  console.log('Order basic info:', {
    madonhang: order.madonhang,
    thanhtien: order.thanhtien,
    phivanchuyen: order.phivanchuyen
  });
  
  // Get voucher usage
  const { data: usageRecords } = await supabase
    .from('magiamgia_sudung')
    .select('mavoucher')
    .eq('madonhang', orderId);
    
  console.log('\nVoucher usage:', usageRecords);
  
  if (usageRecords && usageRecords.length > 0) {
    const voucherIds = usageRecords.map(r => r.mavoucher);
    
    // Get voucher details
    const { data: vouchers } = await supabase
      .from('magiamgia')
      .select('*')
      .in('mavoucher', voucherIds);
      
    console.log('\nVouchers from DB:');
    vouchers.forEach(v => {
      console.log(`- ${v.macode} (${v.hinhthuc_giam}): ${v.tenmagiamgia}`);
    });
    
    // Get order items for subtotal
    const { data: orderItems } = await supabase
      .from('chitietdonhang')
      .select('soluong, dongia')
      .eq('madonhang', orderId);
      
    const subtotal = orderItems?.reduce((sum, item) => sum + (item.soluong * item.dongia), 0) || 0;
    console.log('\nSubtotal:', subtotal.toLocaleString(), 'VND');
    
    // Calculate discount amounts
    const discountVouchers = [];
    const freeshipVouchers = [];
    
    for (const v of vouchers) {
      let actualDiscountAmount = 0;
      
      if (v.hinhthuc_giam === 'FREESHIP') {
        const maxDiscount = v.giam_toi_da || order.phivanchuyen || 0;
        actualDiscountAmount = Math.min(order.phivanchuyen || 0, maxDiscount);
        freeshipVouchers.push({
          magiamgia: v.macode,
          mota: v.mota || v.tenmagiamgia,
          sotiengiam: actualDiscountAmount,
          loaigiamgia: v.hinhthuc_giam
        });
      } else if (v.hinhthuc_giam === 'PERCENT') {
        const calculatedDiscount = Math.round(subtotal * (v.phantram_giam / 100));
        const maxDiscount = v.giam_toi_da || calculatedDiscount;
        actualDiscountAmount = Math.min(calculatedDiscount, maxDiscount);
        discountVouchers.push({
          magiamgia: v.macode,
          mota: v.mota || v.tenmagiamgia,
          phantramgiam: v.phantram_giam,
          sotiengiam: actualDiscountAmount,
          loaigiamgia: v.hinhthuc_giam
        });
      } else if (v.hinhthuc_giam === 'AMOUNT') {
        actualDiscountAmount = v.sotien_giam || 0;
        discountVouchers.push({
          magiamgia: v.macode,
          mota: v.mota || v.tenmagiamgia,
          sotiengiam: actualDiscountAmount,
          loaigiamgia: v.hinhthuc_giam
        });
      }
    }
    
    console.log('\n📊 Kết quả API sẽ trả về:');
    console.log('\nDiscount vouchers:', JSON.stringify(discountVouchers, null, 2));
    console.log('\nFreeship vouchers:', JSON.stringify(freeshipVouchers, null, 2));
    
    console.log('\n💰 Chi tiết thanh toán:');
    console.log(`Tổng tiền hàng: ${subtotal.toLocaleString()} VND`);
    discountVouchers.forEach(v => {
      console.log(`Giảm giá đơn hàng (${v.magiamgia}): -${v.sotiengiam.toLocaleString()} VND`);
    });
    console.log(`Phí vận chuyển: ${order.phivanchuyen.toLocaleString()} VND`);
    freeshipVouchers.forEach(v => {
      console.log(`Giảm phí vận chuyển (${v.magiamgia}): -${v.sotiengiam.toLocaleString()} VND`);
    });
    console.log(`Tổng thanh toán: ${order.thanhtien.toLocaleString()} VND`);
  }
}

checkOrder270().catch(console.error);
