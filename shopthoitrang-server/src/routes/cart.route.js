const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const supabase = require('../../config/db');

// Tất cả route đều cần auth
router.use(authenticateToken);

/**
 * GET /api/cart
 * Lấy giỏ hàng của user hiện tại
 */
router.get('/', async (req, res) => {
  try {
    // Token payload may use different keys; normalize to integer userId
    const rawUserId = req.user?.makhachhang ?? req.user?.maKhachHang ?? req.user?.id ?? req.user?.userId;
    const userId = parseInt(rawUserId, 10);
    if (!userId || Number.isNaN(userId)) {
      console.error('[GET /cart] Invalid userId from token:', req.user);
      return res.status(401).json({ message: 'Không xác định được người dùng từ token' });
    }
    console.log('[GET /cart] userId =', userId, 'from token:', req.user);

    // Lấy giỏ hàng chưa thanh toán (trạng thái = 'cart')
    // Lấy cart gần nhất, không dùng .single() để tránh lỗi khi có nhiều cart
    const { data: carts, error: cartError } = await supabase
      .from('donhang')
      .select('madonhang')
      .eq('makhachhang', userId)
      .eq('trangthaidonhang', 'cart')
      .order('ngaydathang', { ascending: false })
      .limit(1);

    if (cartError) {
      throw cartError;
    }

    // Nếu chưa có giỏ hàng, tạo mới
    let cartId = carts && carts.length > 0 ? carts[0].madonhang : null;
    if (!cartId) {
      const { data: newCart, error: createError } = await supabase
        .from('donhang')
        .insert({
          makhachhang: userId,
          ngaydathang: new Date().toISOString(),
          thanhtien: 0,
          trangthaidonhang: 'cart',
          trangthaithanhtoan: 'unpaid',
        })
        .select()
        .single();

      if (createError) throw createError;
      cartId = newCart.madonhang;
      console.log('[GET /cart] Created new cart:', cartId);
    }

    // Lấy chi tiết giỏ hàng với thông tin sản phẩm
    const { data: items, error: itemsError } = await supabase
      .from('chitietdonhang')
      .select(`
        machitietdonhang,
        machitietsanpham,
        soluong,
        dongia,
        chitietsanpham:machitietsanpham (
          machitietsanpham,
          masanpham,
          kichthuoc,
          mausac,
          giaban,
          soluongton,
          sanpham:masanpham (
            masanpham,
            tensanpham
          )
        )
      `)
      .eq('madonhang', cartId);

  if (itemsError) throw itemsError;
  console.log('[GET /cart] cartId =', cartId, 'items =', (items||[]).length);

    // Lấy hình ảnh cho từng variant
    const variantIds = items?.map(item => item.machitietsanpham).filter(Boolean) || [];
    let imagesByVariant = {};
    
    if (variantIds.length > 0) {
      const { data: images } = await supabase
        .from('hinhanhsanpham')
        .select('machitietsanpham, duongdanhinhanh, mahinhanh')
        .in('machitietsanpham', variantIds)
        .order('mahinhanh', { ascending: true });

      if (images) {
        imagesByVariant = images.reduce((acc, img) => {
          if (!acc[img.machitietsanpham]) {
            acc[img.machitietsanpham] = [];
          }
          acc[img.machitietsanpham].push({
            id: img.mahinhanh,
            url: img.duongdanhinhanh,
            order: img.mahinhanh,
          });
          return acc;
        }, {});
      }
    }

    // Format response
    const cartItems = (items || []).map(item => ({
      id: item.machitietdonhang,
      variantId: item.machitietsanpham,
      quantity: item.soluong,
      price: item.dongia,
      variant: item.chitietsanpham ? {
        id: item.chitietsanpham.machitietsanpham,
        productId: item.chitietsanpham.masanpham,
        size: item.chitietsanpham.kichthuoc,
        color: item.chitietsanpham.mausac,
        price: item.chitietsanpham.giaban,
        stock: item.chitietsanpham.soluongton,
        images: imagesByVariant[item.machitietsanpham] || [],
        product: item.chitietsanpham.sanpham ? {
          id: item.chitietsanpham.sanpham.masanpham,
          name: item.chitietsanpham.sanpham.tensanpham,
        } : null,
      } : null,
    }));

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      cartId,
      items: cartItems,
      total,
      itemCount: cartItems.length,
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ message: error.message || 'Lỗi khi lấy giỏ hàng' });
  }
});

/**
 * POST /api/cart/add
 * Thêm sản phẩm vào giỏ hàng
 * Body: { variantId, quantity, price }
 */
router.post('/add', async (req, res) => {
  try {
    const rawUserId = req.user?.makhachhang ?? req.user?.maKhachHang ?? req.user?.id ?? req.user?.userId;
    const userId = parseInt(rawUserId, 10);
    if (!userId || Number.isNaN(userId)) {
      console.error('[POST /cart/add] Invalid userId from token:', req.user);
      return res.status(401).json({ message: 'Không xác định được người dùng từ token' });
    }
    let { variantId, quantity = 1, price } = req.body;
    variantId = parseInt(variantId, 10);
    quantity = parseInt(quantity, 10);
    const unitPrice = Number(price);
    console.log('[POST /cart/add] userId=', userId, 'variantId=', variantId, 'qty=', quantity, 'price=', unitPrice);

    if (!variantId || Number.isNaN(variantId)) {
      return res.status(400).json({ message: 'Thiếu hoặc sai biến thể sản phẩm (variantId)' });
    }
    if (!unitPrice || Number.isNaN(unitPrice)) {
      return res.status(400).json({ message: 'Thiếu hoặc sai đơn giá' });
    }
    if (!quantity || Number.isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }

    // Lấy hoặc tạo giỏ hàng
    // Lấy cart gần nhất thay vì .single() để tránh lỗi
    let { data: carts, error: cartError } = await supabase
      .from('donhang')
      .select('madonhang')
      .eq('makhachhang', userId)
      .eq('trangthaidonhang', 'cart')
      .order('ngaydathang', { ascending: false })
      .limit(1);

    if (cartError) {
      throw cartError;
    }

    let cartId = carts && carts.length > 0 ? carts[0].madonhang : null;
    if (!cartId) {
      const { data: newCart, error: createError } = await supabase
        .from('donhang')
        .insert({
          makhachhang: userId,
          ngaydathang: new Date().toISOString(),
          thanhtien: 0,
          trangthaidonhang: 'cart',
          trangthaithanhtoan: 'unpaid',
        })
        .select()
        .single();

      if (createError) throw createError;
      cartId = newCart.madonhang;
      console.log('[POST /cart/add] Created new cart:', cartId);
    } else {
      console.log('[POST /cart/add] Using existing cart:', cartId);
    }

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const { data: existing, error: checkError } = await supabase
      .from('chitietdonhang')
      .select('machitietdonhang, soluong')
      .eq('madonhang', cartId)
  .eq('machitietsanpham', variantId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let result;
    if (existing) {
      // Cập nhật số lượng
      console.log('[POST /cart/add] Updating existing item:', existing.machitietdonhang, 'new qty:', existing.soluong + quantity);
      const { data, error } = await supabase
        .from('chitietdonhang')
        .update({ soluong: existing.soluong + quantity })
        .eq('machitietdonhang', existing.machitietdonhang)
        .select()
        .single();

      if (error) {
        console.error('[POST /cart/add] Update error:', error);
        throw error;
      }
      result = data;
      console.log('[POST /cart/add] Updated successfully:', result);
    } else {
      // Thêm mới
      const insertData = {
        madonhang: cartId,
        machitietsanpham: variantId,
        soluong: quantity,
        dongia: unitPrice,
      };
      console.log('[POST /cart/add] Inserting new item:', insertData);
      
      const { data, error } = await supabase
        .from('chitietdonhang')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[POST /cart/add] Insert error:', error);
        console.error('[POST /cart/add] Insert error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      result = data;
      console.log('[POST /cart/add] Inserted successfully:', result);
    }

    res.json({
      message: 'Đã thêm vào giỏ hàng',
      item: result,
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: error.message || 'Lỗi khi thêm vào giỏ hàng' });
  }
});

/**
 * PUT /api/cart/update/:itemId
 * Cập nhật số lượng sản phẩm
 * Body: { quantity }
 */
router.put('/update/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    let { quantity } = req.body;
    quantity = parseInt(quantity, 10);

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Số lượng không hợp lệ' });
    }

    const { data, error } = await supabase
      .from('chitietdonhang')
      .update({ soluong: quantity })
      .eq('machitietdonhang', itemId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Đã cập nhật số lượng',
      item: data,
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: error.message || 'Lỗi khi cập nhật' });
  }
});

/**
 * DELETE /api/cart/remove/:itemId
 * Xóa sản phẩm khỏi giỏ hàng
 */
router.delete('/remove/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const id = parseInt(itemId, 10);

    const { error } = await supabase
      .from('chitietdonhang')
      .delete()
      .eq('machitietdonhang', id);

    if (error) throw error;

    res.json({ message: 'Đã xóa khỏi giỏ hàng' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: error.message || 'Lỗi khi xóa' });
  }
});

/**
 * DELETE /api/cart/clear
 * Xóa toàn bộ giỏ hàng
 */
router.delete('/clear', async (req, res) => {
  try {
    const rawUserId = req.user?.makhachhang ?? req.user?.maKhachHang ?? req.user?.id ?? req.user?.userId;
    const userId = parseInt(rawUserId, 10);
    if (!userId || Number.isNaN(userId)) {
      console.error('[DELETE /cart/clear] Invalid userId from token:', req.user);
      return res.status(401).json({ message: 'Không xác định được người dùng từ token' });
    }

    const { data: cart } = await supabase
      .from('donhang')
      .select('madonhang')
      .eq('makhachhang', userId)
      .eq('trangthaidonhang', 'cart')
      .single();

    if (cart) {
      await supabase
        .from('chitietdonhang')
        .delete()
        .eq('madonhang', cart.madonhang);
    }

    res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: error.message || 'Lỗi khi xóa giỏ hàng' });
  }
});

module.exports = router;
