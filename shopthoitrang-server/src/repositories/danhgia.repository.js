const { createClient } = require('@supabase/supabase-js');
const DanhGia = require('../models/danhgia.model');

const supabase = require('../../config/db');
const TABLE = 'danhgia';

const DanhGiaRepository = {
  async getAll(filters = {}) {
    // Lấy dữ liệu danhgia trước
    let query = supabase.from(TABLE).select('*');

    if (filters.masanpham) query = query.eq('masanpham', filters.masanpham);
    if (filters.makhachhang) query = query.eq('makhachhang', filters.makhachhang);
    if (filters.diemdanhgia) query = query.eq('diemdanhgia', filters.diemdanhgia);

    const { data, error } = await query.order('ngaydanhgia', { ascending: false });
    if (error) throw error;
    
    // Lấy thông tin khách hàng và sản phẩm riêng
    const customerIds = [...new Set(data.map(r => r.makhachhang).filter(Boolean))];
    const productIds = [...new Set(data.map(r => r.masanpham).filter(Boolean))];
    
    // Load customers
    const customersMap = {};
    if (customerIds.length > 0) {
      // Query from taikhoankhachhang table (not khachhang)
      const { data: customers } = await supabase
        .from('taikhoankhachhang')
        .select('makhachhang, hoten, tendangnhap, email, hinhanh')
        .in('makhachhang', customerIds);
      
      if (customers) {
        customers.forEach(c => {
          customersMap[c.makhachhang] = c;
        });
      }
    }
    
    // Load products
    const productsMap = {};
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('sanpham')
        .select('masanpham, tensanpham, hinhanh')
        .in('masanpham', productIds);
      
      if (products) {
        products.forEach(p => {
          productsMap[p.masanpham] = p;
        });
      }
    }
    
  // Load order detail + variant info for reviews that have machitietdonhang
    const orderDetailIds = [...new Set(data.map(r => r.machitietdonhang).filter(Boolean))];
    const orderDetailsMap = {};
    const orderInfoMap = {}; // Store order info (madonhang, ngaydathang, tongtien)
    if (orderDetailIds.length > 0) {
      const { data: orderDetails } = await supabase
        .from('chitietdonhang')
        .select('machitietdonhang, mabienthe, madonhang, soluong, giaban')
        .in('machitietdonhang', orderDetailIds);
      
      if (orderDetails && orderDetails.length > 0) {
        // Get order IDs to fetch order info
        const orderIds = [...new Set(orderDetails.map(od => od.madonhang).filter(Boolean))];
        if (orderIds.length > 0) {
          const { data: orders } = await supabase
            .from('donhang')
            .select('madonhang, ngaydathang, tongtien, trangthaidonhang')
            .in('madonhang', orderIds);
          
          if (orders) {
            orders.forEach(o => {
              orderInfoMap[o.madonhang] = o;
            });
          }
        }
      
        // Get variant IDs
        const variantIds = [...new Set(orderDetails.map(od => od.mabienthe).filter(Boolean))];
        if (variantIds.length > 0) {
          const { data: variants } = await supabase
            .from('bienthesanpham')
            .select('mabienthe, kichco, mausac, hinhanh')
            .in('mabienthe', variantIds);
          
          const variantsMap = {};
          if (variants) {
            variants.forEach(v => {
              variantsMap[v.mabienthe] = v;
            });
          }
          
          // Map order details with variants and order info
          orderDetails.forEach(od => {
            const variant = variantsMap[od.mabienthe] || {};
            const orderInfo = orderInfoMap[od.madonhang];
            orderDetailsMap[od.machitietdonhang] = {
              ...variant,
              soluong: od.soluong,
              giaban: od.giaban,
              madonhang: od.madonhang,
              ngaydathang: orderInfo?.ngaydathang,
              tongtien: orderInfo?.tongtien,
              trangthaidonhang: orderInfo?.trangthaidonhang
            };
          });
        }
      }
    }
    
    // Fallback: for reviews missing variant info, attempt to infer from customer's latest orders of this product
    const missingPairs = [];
    for (const r of data) {
      const hasVariant = !!(r.machitietdonhang && orderDetailsMap[r.machitietdonhang]);
      if (!hasVariant && r.makhachhang && r.masanpham) {
        missingPairs.push(`${r.makhachhang}-${r.masanpham}`);
      }
    }
    const uniquePairs = [...new Set(missingPairs)];
    const inferredVariantByPair = {}; // key: "makhachhang-masanpham" -> { kichco, mausac, hinhanh, madonhang?, ngaydathang? }
    for (const key of uniquePairs) {
      try {
        const [makhachhangStr, masanphamStr] = key.split('-');
        const makhachhang = Number(makhachhangStr);
        const masanpham = Number(masanphamStr);
        // 1) Lấy 10 đơn gần nhất của khách
        const { data: orders } = await supabase
          .from('donhang')
          .select('madonhang, ngaydathang')
          .eq('makhachhang', makhachhang)
          .order('ngaydathang', { ascending: false })
          .limit(10);

        if (!orders || orders.length === 0) continue;
        const orderIds = orders.map(o => o.madonhang);
        const orderIndex = {};
        orders.forEach((o, idx) => { orderIndex[o.madonhang] = idx; });
        const ordersById = {};
        orders.forEach(o => { ordersById[o.madonhang] = o; });

        // 2) Lấy chi tiết đơn hàng của các đơn đó
        const { data: ods } = await supabase
          .from('chitietdonhang')
          .select('machitietdonhang, madonhang, mabienthe')
          .in('madonhang', orderIds);
        if (!ods || ods.length === 0) continue;

        const variantIds2 = [...new Set(ods.map(x => x.mabienthe).filter(Boolean))];
        if (variantIds2.length === 0) continue;

        // 3) Lấy variant để biết masanpham, size, color
        const { data: variants2 } = await supabase
          .from('bienthesanpham')
          .select('mabienthe, masanpham, kichco, mausac, hinhanh')
          .in('mabienthe', variantIds2);
        if (!variants2) continue;
        const vmap = {};
        variants2.forEach(v => { vmap[v.mabienthe] = v; });

        // 4) Tìm bản ghi chi tiết thuộc đúng sản phẩm, ưu tiên đơn gần nhất
        let chosenVariant = null;
        let chosenOd = null;
        let bestOrderIdx = Number.MAX_SAFE_INTEGER;
        for (const od of ods) {
          const v = vmap[od.mabienthe];
          if (!v) continue;
          if (Number(v.masanpham) !== masanpham) continue;
          const idx = orderIndex[od.madonhang] ?? 99999;
          if (idx < bestOrderIdx) {
            bestOrderIdx = idx;
            chosenVariant = v;
            chosenOd = od;
          }
        }
        if (chosenVariant) {
          inferredVariantByPair[key] = {
            kichco: chosenVariant.kichco,
            mausac: chosenVariant.mausac,
            hinhanh: chosenVariant.hinhanh,
            madonhang: chosenOd?.madonhang || null,
            ngaydathang: chosenOd?.madonhang ? ordersById[chosenOd.madonhang]?.ngaydathang : null,
          };
        }
      } catch (e) {
        // ignore pair inference errors to keep list resilient
        // console.log('Infer variant fallback error for pair', key, e);
      }
    }

    // Map data với thông tin khách hàng, sản phẩm và variant
    return data.map((r) => {
      const review = new DanhGia(r);
      
      // Thêm thông tin khách hàng
      const customer = customersMap[r.makhachhang];
      if (customer) {
        // Use hoten from taikhoankhachhang table, fallback to tendangnhap or email
        review.tenkhachhang = customer.hoten || customer.tendangnhap || customer.email || `KH #${r.makhachhang}`;
        review.hinhanhkhachhang = customer.hinhanh;
      }
      
      // Thêm thông tin sản phẩm
      const product = productsMap[r.masanpham];
      if (product) {
        review.tensanpham = product.tensanpham;
        review.hinhanhsanpham = product.hinhanh;
      }
      
      // Thêm thông tin variant (size, màu) và đơn hàng
      const orderDetail = orderDetailsMap[r.machitietdonhang];
      if (orderDetail) {
        review.kichco = orderDetail.kichco;
        review.mausac = orderDetail.mausac;
        review.hinhanhbienthe = orderDetail.hinhanh;
        review.madonhang = orderDetail.madonhang;
        review.ngaydathang = orderDetail.ngaydathang;
        review.tongtiendonhang = orderDetail.tongtien;
        review.trangthaidonhang = orderDetail.trangthaidonhang;
        review.soluongmua = orderDetail.soluong;
        review.giabanmua = orderDetail.giaban;
      } else if (r.makhachhang && r.masanpham) {
        const key = `${r.makhachhang}-${r.masanpham}`;
        const inf = inferredVariantByPair[key];
        if (inf) {
          review.kichco = inf.kichco;
          review.mausac = inf.mausac;
          review.hinhanhbienthe = inf.hinhanh;
          // Gắn kèm mã đơn hàng suy luận được (để admin có thể mở chi tiết)
          if (inf.madonhang) {
            review.madonhang = inf.madonhang;
            review.ngaydathang = inf.ngaydathang;
          }
        }
      }
      
      return review;
    });
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madanhgia', id)
      .maybeSingle();

    if (error) throw error;
    return data ? new DanhGia(data) : null;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new DanhGia(data);
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('madanhgia', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new DanhGia(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('madanhgia', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? new DanhGia(data) : null;
  },
};

module.exports = DanhGiaRepository;
