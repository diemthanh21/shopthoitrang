const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const momoService = require('../services/momo.service');
const donhangRepository = require('../repositories/donhang.repository');

function extractOrderId(momoOrderId) {
  if (!momoOrderId) return null;
  const [id] = momoOrderId.toString().split('-');
  const parsed = Number(id);
  return Number.isNaN(parsed) ? null : parsed;
}

router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { orderId, forceRefresh } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const order = await donhangRepository.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (
      req.user?.makhachhang &&
      Number(order.makhachhang) !== Number(req.user.makhachhang)
    ) {
      return res.status(403).json({ message: 'Order does not belong to current user' });
    }

    const payload = await momoService.createPaymentForOrder(orderId, {
      forceRefresh: !!forceRefresh,
    });
    return res.json(payload);
  } catch (err) {
    console.error('[MoMo] create payment error:', err?.message || err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to create MoMo payment' });
  }
});

router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }
    const order = await donhangRepository.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (
      req.user?.makhachhang &&
      Number(order.makhachhang) !== Number(req.user.makhachhang)
    ) {
      return res.status(403).json({ message: 'Order does not belong to current user' });
    }

    const orderJson = order.toJSON();
    const momoOrderId = orderJson.momo_order_id || `${orderId}`;
    const result = await momoService.queryTransaction({
      orderId: momoOrderId,
      requestId: orderJson.momo_request_id || undefined,
    });
    const paid = result?.resultCode === 0;

    if (paid) {
      try {
        const updates = { trangthaithanhtoan: 'Da thanh toan' };
        const nextStatus = (orderJson.trangthaidonhang || '').trim();
        if (!nextStatus || nextStatus === 'Ch? x?c nh?n') {
          updates.trangthaidonhang = 'Ch? l?y h?ng';
        }
        await donhangRepository.update(orderId, updates);
      } catch (updateErr) {
        console.warn('[MoMo] verify update order failed:', updateErr?.message || updateErr);
      }
    }

    res.json({
      paid,
      resultCode: result?.resultCode,
      message: result?.message,
      order: (await donhangRepository.getById(orderId))?.toJSON() || orderJson,
    });
  } catch (err) {
    console.error('[MoMo] verify error:', err?.message || err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to verify MoMo payment' });
  }
});

router.post('/ipn', async (req, res) => {
  try {
    const payload = req.body || {};
    const valid = momoService.verifyIpnSignature(payload);
    if (!valid) {
      return res.status(400).json({ resultCode: 11, message: 'Invalid signature' });
    }
    const momoOrderId = payload.orderId || payload.orderid;
    const baseOrderId = extractOrderId(momoOrderId);
    if (!baseOrderId) {
      return res.status(400).json({ resultCode: 10, message: 'Invalid orderId' });
    }
    const order = await donhangRepository.getById(baseOrderId);
    if (!order) {
      return res.status(404).json({ resultCode: 1, message: 'Order not found' });
    }

    if (String(payload.resultCode) === '0') {
      try {
        await donhangRepository.update(baseOrderId, {
          trangthaithanhtoan: 'Da thanh toan',
          trangthaidonhang: 'Ch? l?y h?ng',
        });
      } catch (updateErr) {
        console.warn('[MoMo] IPN update failed:', updateErr?.message || updateErr);
      }
    }

    res.json({ resultCode: 0, message: 'Received' });
  } catch (err) {
    console.error('[MoMo] IPN error:', err?.message || err);
    res.status(500).json({ resultCode: 99, message: 'Internal error' });
  }
});

module.exports = router;
