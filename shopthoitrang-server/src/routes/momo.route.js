const router = require('express').Router();
const authenticateToken = require('../middlewares/auth.middleware');
const donhangRepository = require('../repositories/donhang.repository');
const donhangService = require('../services/donhang.service');
const momo = require('../services/momo.service');

// Create MoMo payment for an order
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { orderId, forceRefresh } = req.body || {};
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    // Ensure order exists and amount valid
    const order = await donhangRepository.getById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Persist payment method to MOMO to keep DB in sync with mobile selection
    try {
      await donhangService.update(orderId, { phuongthucthanhtoan: 'MOMO' });
    } catch (syncErr) {
      console.warn('[MoMo] Failed to sync payment method to MOMO for order', orderId, syncErr?.message || syncErr);
    }

    const data = await momo.createPaymentForOrder(orderId, { forceRefresh: !!forceRefresh });

    // Normalize common fields for mobile client
    const response = {
      success: true,
      data,
      payUrl: data.payUrl || data.shortLink || data.deeplink || data.qrCodeUrl || null,
      qrCodeUrl: data.qrCodeUrl || data.payUrl || null,
      resultCode: data.resultCode,
      message: data.message,
      expiresAt: data.expiresAt || null,
      reused: !!data.reused,
    };
    return res.json(response);
  } catch (err) {
    console.error('[MoMo] create error:', err?.response?.data || err?.message || err);
    res.status(err.status || 500).json({ message: err.message || 'MoMo create failed' });
  }
});

// MoMo IPN callback
router.post('/ipn', async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[MoMo] IPN endpoint hit. Headers:', req.headers);
    console.log('[MoMo] IPN payload:', JSON.stringify(payload));
    let { orderId, resultCode, amount } = payload;

    // Our create call uses composite orderId like "<localId>-<ts>"; extract the base local id
    let baseOrderId = orderId;
    if (typeof orderId === 'string' && orderId.includes('-')) {
      baseOrderId = orderId.split('-')[0];
    }
    if (typeof baseOrderId === 'string') {
      const parsed = parseInt(baseOrderId, 10);
      if (!Number.isNaN(parsed)) baseOrderId = parsed;
    }

    // Verify signature; if verification not required in sandbox you can relax, but keep for prod
    try {
      const ok = momo.verifyIpnSignature(payload);
      console.log('[MoMo] IPN signature verification result:', ok);
      if (!ok) {
        console.warn('[MoMo] IPN signature invalid for order', orderId);
        return res.status(400).json({ message: 'Invalid signature' });
      }
    } catch (sigErr) {
      console.warn('[MoMo] IPN signature check failed:', sigErr?.message || sigErr);
      // Do not hard fail in sandbox; return 200 to avoid retries unless you want strict verification
    }

    const order = await donhangRepository.getById(baseOrderId);
    if (!order) {
      console.warn('[MoMo] IPN: order not found', baseOrderId, '(raw orderId:', orderId, ')');
      return res.json({ success: true, matched: false });
    }

    const orderJson = order.toJSON();
    const expectedAmount = Math.round(Number(orderJson.thanhtien) || 0);
    const paidAmount = Math.round(Number(amount) || 0);

    // Only accept success code 0
    if (Number(resultCode) === 0) {
      if (expectedAmount > 0 && paidAmount > 0 && Math.abs(expectedAmount - paidAmount) > 2000) {
        console.warn('[MoMo] IPN amount mismatch:', { orderId, expectedAmount, paidAmount });
      }

      const currentOrderStatus = orderJson.trangthaidonhang || orderJson.trangThaiDonHang || '';
      const normalizedStatus = currentOrderStatus
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
      const shouldMoveToPickup = !normalizedStatus || normalizedStatus === 'CHO XAC NHAN';

      const updatePayload = {
        trangthaithanhtoan: 'Đã thanh toán',
        phuongthucthanhtoan: 'MOMO',
      };
      if (shouldMoveToPickup) {
        updatePayload.trangthaidonhang = 'Chờ lấy hàng';
      }

      await donhangService.update(baseOrderId, updatePayload);
      return res.json({ success: true, matched: true, orderId: baseOrderId });
    }

    // Non-success result: revert payment method to COD for manual handling
    console.warn('[MoMo] IPN non-success result', { orderId, resultCode });
    try {
      const orderJson = order.toJSON();
      const paymentStatus = orderJson.trangthaithanhtoan || orderJson.trangThaiThanhToan || '';
      const paymentMethod = orderJson.phuongthucthanhtoan || orderJson.phuongThucThanhToan || '';
      const isPaidAlready = String(paymentStatus).toLowerCase().includes('đã');
      if (!isPaidAlready && String(paymentMethod).toUpperCase() === 'MOMO') {
        await donhangService.update(baseOrderId, {
          phuongthucthanhtoan: 'COD',
          // keep payment status unchanged if present else ensure 'Chưa thanh toán'
          trangthaithanhtoan: paymentStatus || 'Chưa thanh toán',
        });
        console.log('[MoMo] Reverted payment method to COD for order', baseOrderId);
      }
    } catch (revertErr) {
      console.warn('[MoMo] Failed to revert payment method on non-success IPN:', revertErr?.message || revertErr);
    }
    return res.json({ success: true, matched: true, orderId: baseOrderId, resultCode });
  } catch (err) {
    console.error('[MoMo] IPN error:', err?.message || err);
    res.status(500).json({ message: 'Internal error' });
  }
});

// Manual verify endpoint: mobile can trigger when IPN delay occurs
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    // Load order to get MoMo-composed id if present
    const order = await donhangRepository.getById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const o = order.toJSON();
    const momoOrderId = o.momo_order_id || `${orderId}`;

    const data = await momo.queryTransaction({ orderId: momoOrderId, requestId: o.momo_request_id });

    let updated = null;
    if (Number(data.resultCode) === 0) {
      updated = await donhangService.update(orderId, {
        trangthaithanhtoan: 'Đã thanh toán',
        phuongthucthanhtoan: 'MOMO',
      });
    }

    const finalOrder = updated ? updated.toJSON() : o;
    const status = finalOrder.trangthaidonhang || finalOrder.trangThaiDonHang || null;

    return res.json({
      success: true,
      resultCode: data.resultCode,
      message: data.message,
      paid: Number(data.resultCode) === 0,
      order: finalOrder,
      trangthaidonhang: status,
    });
  } catch (err) {
    console.error('[MoMo] verify error:', err?.message || err);
    res.status(500).json({ message: 'Verify failed' });
  }
});

module.exports = router;
