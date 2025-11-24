const { createClient } = require('./shopthoitrang-server/node_modules/@supabase/supabase-js');
require('./shopthoitrang-server/node_modules/dotenv/lib/main').config({ path: './shopthoitrang-server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkOrder() {
  console.log('\n=== Kiểm tra Order #267 ===\n');
  
  // 1. Lấy thông tin đơn hàng
  const { data: order, error } = await supabase
    .from('donhang')
    .select('*')
    .eq('madonhang', 267)
    .single();
    
  if (error) {
    console.error('❌ Lỗi:', error);
    return;
  }
  
  console.log('📦 Đơn hàng #267 - Tất cả các field:');
  console.log(JSON.stringify(order, null, 2));
  
  // 2. Lấy chi tiết đơn hàng để tính subtotal
  const { data: orderDetails } = await supabase
    .from('chitietdonhang')
    .select('*')
    .eq('madonhang', 267);
    
  console.log('\n📋 Chi tiết đơn hàng:');
  console.log(JSON.stringify(orderDetails, null, 2));
  
  if (orderDetails && orderDetails.length > 0) {
    const subtotal = orderDetails.reduce((sum, item) => sum + ((item.dongia || 0) * (item.soluong || 0)), 0);
    const total = order.thanhtien;
    const discount = subtotal + (order.phivanchuyen || 0) - total;
    
    console.log('\n💰 Tính toán:');
    console.log('- Tổng tiền hàng (subtotal):', subtotal.toLocaleString(), 'VND');
    console.log('- Phí vận chuyển:', order.phivanchuyen?.toLocaleString() || 0, 'VND');
    console.log('- Tổng thanh toán:', total.toLocaleString(), 'VND');
    console.log('- Giảm giá (tính ngược):', discount.toLocaleString(), 'VND');
  }
  
  // 3. Nếu có mã giảm giá, kiểm tra bảng magiamgia
  if (order.magiamgia) {
    const codes = order.magiamgia.split(/[,|]/);
    console.log('\n💳 Mã giảm giá:', codes);
    
    const { data: discounts } = await supabase
      .from('magiamgia')
      .select('*')
      .in('magiamgia', codes);
      
    console.log('Chi tiết:', JSON.stringify(discounts, null, 2));
  } else {
    console.log('\n⚠️ Đơn hàng KHÔNG có field magiamgia');
  }
  
  // 3. Kiểm tra orderJson có magiamgia không
  if (order.orderjson?.magiamgia) {
    console.log('\n📝 orderJson có magiamgia:', order.orderjson.magiamgia);
  }
  
  process.exit(0);
}

checkOrder();
