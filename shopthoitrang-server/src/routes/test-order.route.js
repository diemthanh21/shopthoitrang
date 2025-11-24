const router = require('express').Router();
const crypto = require('crypto');
const axios = require('axios');
const supabase = require('../../config/db');
const donhangRepository = require('../repositories/donhang.repository');
const donhangService = require('../services/donhang.service');
const authenticateToken = require('../middlewares/auth.middleware');

const AMOUNT_TOLERANCE = 2000;
const ORDER_CODE_REGEX = /(?:DH|DONHANG|ORDER|ORD|#)(\d{3,})/i;
const PHONE_FALLBACK_REGEX = /(SHOPTT)(.*)$/i;
const SEPAY_API_BASE_URL = process.env.SEPAY_API_BASE_URL || 'https://pgapi-sandbox.sepay.vn';
const SEPAY_CHECKOUT_BASE_URL = process.env.SEPAY_CHECKOUT_URL || 'https://pay-sandbox.sepay.vn';

const normalizeStatus = value =>
  (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const digitsOnly = value => (value || '').toString().replace(/\D/g, '');

const parseAmount = value => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const extractOrderIdFromCode = raw => {
  if (!raw) return null;
  const str = String(raw).trim();
  const codeMatch = str.match(ORDER_CODE_REGEX);
  if (codeMatch) return parseInt(codeMatch[1], 10);
  if (/^\d{3,}$/.test(str)) return parseInt(str, 10);
  return null;
};

const extractPhoneFromContent = raw => {
  if (!raw) return null;
  const text = String(raw);
  let searchTarget = text;
  const phoneHint = text.match(PHONE_FALLBACK_REGEX);
  if (phoneHint && phoneHint[2]) {
    searchTarget = phoneHint[2];
  }
  const match = searchTarget.match(/(\+?84|0)\d{8,10}/);
  if (!match) return null;
  let phone = match[0];
  if (phone.startsWith('+84')) {
    phone = `0${phone.slice(3)}`;
  }
  return digitsOnly(phone);
};

const findOrderByPhone = async (phoneDigits, amount) => {
  if (!phoneDigits) return null;
  try {
    const tail = phoneDigits.slice(-6);
    const { data, error } = await supabase
      .from('diachigiaohang')
      .select('madonhang, sodienthoai')
      .ilike('sodienthoai', `%${tail}%`)
      .order('madonhang', { ascending: false })
      .limit(5);

    if (error) {
      console.warn('[SePay IPN] Lookup diachigiaohang failed:', error.message || error);
      return null;
    }

    for (const row of data || []) {
      const order = await donhangRepository.getById(row.madonhang);
      if (!order) continue;
      const orderJson = order.toJSON();
      const orderAmount = Number(orderJson.thanhtien) || 0;
      if (amount > 0) {
        const diff = Math.abs(orderAmount - amount);
        if (diff > AMOUNT_TOLERANCE) continue;
      }
      return order;
    }
  } catch (err) {
    console.error('[SePay IPN] findOrderByPhone error:', err.message || err);
  }
  return null;
};

router.post('/sepay/ipn', async (req, res) => {
  try {
    const configuredKey = process.env.SEPAY_WEBHOOK_KEY;
    const authHeader = req.get('authorization') || '';
    if (!configuredKey) {
      console.warn('[SePay IPN] Missing SEPAPY_WEBHOOK_KEY, refusing request.');
      return res.status(500).json({ message: 'Webhook key is not configured' });
    }

    if (!authHeader.toLowerCase().startsWith('apikey ')) {
      return res.status(401).json({ message: 'Missing Apikey header' });
    }

    const providedKey = authHeader.slice(7).trim();
    if (providedKey !== configuredKey) {
      console.warn('[SePay IPN] Invalid API key received');
      return res.status(401).json({ message: 'Invalid API key' });
    }

    const payload = req.body || {};
    const eventData = payload.data || payload.transaction || payload || {};
    const orderCode = eventData.order_code || eventData.orderCode || payload.order_code || null;
    const transactionId = eventData.transaction_code || eventData.transactionCode || eventData.id || payload.id || null;
    const description = eventData.description || eventData.content || eventData.note || payload.description || '';
    const amount = parseAmount(eventData.amount || eventData.money || eventData.total_amount || payload.amount);
    const eventType = payload.event || eventData.event || 'unknown';

    let matchedOrder = null;
    let matchedBy = null;

    const orderIdFromCode = extractOrderIdFromCode(orderCode);
    if (orderIdFromCode) {
      matchedOrder = await donhangRepository.getById(orderIdFromCode);
      matchedBy = 'order_code';
      if (matchedOrder) {
        const orderJson = matchedOrder.toJSON();
        const diff = Math.abs((Number(orderJson.thanhtien) || 0) - amount);
        if (amount > 0 && diff > AMOUNT_TOLERANCE) {
          console.warn('[SePay IPN] Matched order but amount mismatch:', {
            orderId: orderIdFromCode,
            expected: orderJson.thanhtien,
            paid: amount,
          });
          matchedOrder = null;
          matchedBy = null;
        }
      }
    }

    if (!matchedOrder) {
      const phone = extractPhoneFromContent(description);
      if (phone) {
        matchedOrder = await findOrderByPhone(phone, amount);
        matchedBy = matchedOrder ? 'transfer_content' : null;
      }
    }

    if (!matchedOrder) {
      console.warn('[SePay IPN] No order matched for incoming payment', {
        orderCode,
        description,
        amount,
        transactionId,
      });
      return res.json({
        success: true,
        matched: false,
        message: 'No matching order found',
      });
    }

    const order = matchedOrder.toJSON();
    const updates = {};
    const normalizedPayment = normalizeStatus(order.trangthaithanhtoan);

    if (normalizedPayment !== 'DA THANH TOAN') {
      updates.trangthaithanhtoan = 'Da thanh toan';
    }

    if (Object.keys(updates).length === 0) {
      console.log('[SePay IPN] Order already paid, no update needed', {
        orderId: order.madonhang,
        transactionId,
      });
      return res.json({
        success: true,
        matched: true,
        orderId: order.madonhang,
        message: 'Order already marked as paid',
      });
    }

    await donhangService.update(order.madonhang, updates);

    console.log('[SePay IPN] Order payment updated', {
      orderId: order.madonhang,
      transactionId,
      matchedBy,
      eventType,
    });

    return res.json({
      success: true,
      matched: true,
      orderId: order.madonhang,
      matchedBy,
      message: 'Payment marked as paid',
    });
  } catch (err) {
    console.error('[SePay IPN] Error handling webhook:', err.message || err);
    res.status(500).json({ message: 'Internal error' });
  }
});

const buildSignature = payload => {
  const whitelist = [
    'merchant',
    'operation',
    'payment_method',
    'order_amount',
    'currency',
    'order_invoice_number',
    'order_description',
    'customer_id',
    'success_url',
    'error_url',
    'cancel_url'
  ];

  const dataToSign = whitelist
    .filter(key => payload[key])
    .map(key => `${key}=${payload[key]}`)
    .join(',');

  return crypto.createHmac('sha256', process.env.SEPAY_SECRET_KEY).update(dataToSign).digest('base64');
};

const escapeHtml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

router.post('/sepay/order', authenticateToken, async (req, res, next) => {
  try {
    const merchantCode = process.env.SEPAY_MERCHANT_ID || process.env.SEPAY_PG_MERCHANT;
    if (!merchantCode) {
      return res.status(500).json({ message: 'SEPAY_MERCHANT_ID is not configured' });
    }
    if (!process.env.SEPAY_SECRET_KEY) {
      return res.status(500).json({ message: 'Thiếu SEPAPY_SECRET_KEY để ký yêu cầu.' });
    }
    const { orderId, description, customerName, customerPhone, customerEmail } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const order = await donhangRepository.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderJson = order.toJSON();
    const rawAmount = Number(orderJson.thanhtien) || 0;
    const amount = Math.round(rawAmount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Order amount is invalid' });
    }

    let buyerName = customerName;
    let buyerPhone = customerPhone;
    let buyerEmail = customerEmail;

    try {
      const { data: addr } = await supabase
        .from('diachigiaohang')
        .select('ten, sodienthoai, email')
        .eq('madonhang', orderId)
        .maybeSingle();
      if (addr) {
        if (!buyerName && addr.ten) buyerName = addr.ten;
        if (!buyerPhone && addr.sodienthoai) buyerPhone = addr.sodienthoai;
        if (!buyerEmail && addr.email) buyerEmail = addr.email;
      }
    } catch (addrErr) {
      console.warn('[SePay order] Fetch shipping snapshot failed:', addrErr.message || addrErr);
    }

    const digitsPhone = buyerPhone ? digitsOnly(buyerPhone) : null;
    let normalizedPhone = digitsPhone;
    if (normalizedPhone && normalizedPhone.startsWith('84') && normalizedPhone.length >= 11) {
      normalizedPhone = `0${normalizedPhone.slice(2)}`;
    }
    if (normalizedPhone && !normalizedPhone.startsWith('0')) {
      normalizedPhone = `0${normalizedPhone}`;
    }

    buyerName = buyerName || req.user?.hoten || 'Khach hang';
    buyerPhone = normalizedPhone || req.user?.sodienthoai || '0900000000';
    buyerEmail = buyerEmail || req.user?.email || 'payments@shopthoitrang.vn';

    const orderCode = `DH${orderId}-${Date.now()}`;
    const formPayload = {
      merchant_id: process.env.SEPAY_MERCHANT_ID,
      order_code: orderCode,
      amount,
      currency: 'VND',
      description: description || `Thanh toan don hang #${orderId}`,
      return_url: process.env.SEPAY_RETURN_URL,
      ipn_url: process.env.SEPAY_IPN_URL,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
    };

    const signature = buildSignature({
      merchant: merchantCode,
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_amount: String(amount),
      currency: 'VND',
      order_invoice_number: formPayload.order_code,
      order_description: formPayload.description,
      customer_id: buyerPhone,
      success_url: process.env.SEPAY_RETURN_URL,
      error_url: process.env.SEPAY_RETURN_URL,
      cancel_url: process.env.SEPAY_RETURN_URL,
    });

    const checkoutFields = {
      merchant: merchantCode,
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: formPayload.order_code,
      order_amount: String(amount),
      currency: 'VND',
      order_description: formPayload.description,
      customer_id: buyerPhone,
      success_url: process.env.SEPAY_RETURN_URL,
      error_url: process.env.SEPAY_RETURN_URL,
      cancel_url: process.env.SEPAY_RETURN_URL,
      signature,
    };

    const checkoutUrl = new URL('/v1/checkout/init', SEPAY_CHECKOUT_BASE_URL).toString();
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Redirecting to SePay</title>
</head>
<body>
  <p>Đang chuyển đến cổng thanh toán SePay...</p>
  <form id="sepayCheckout" method="POST" action="${checkoutUrl}">
    ${Object.entries(checkoutFields)
      .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`)
      .join('\n    ')}
  </form>
  <script>
    document.getElementById('sepayCheckout').submit();
  </script>
  <noscript>
    <p>Nhấn nút bên dưới để tiếp tục.</p>
    <button type="submit" form="sepayCheckout">Tiếp tục</button>
  </noscript>
</body>
</html>`;

    res.json({
      success: true,
      checkout_url: checkoutUrl,
      transaction_code: formPayload.order_code,
      form_fields: checkoutFields,
      auto_submit_html: html,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/sepay/test-order', async (req, res, next) => {
  try {
    const payload = {
      merchant_id: process.env.SEPAY_MERCHANT_ID,
      order_code: `TEST-${Date.now()}`,
      amount: 100000,
      currency: 'VND',
      description: 'Test payment',
      return_url: process.env.SEPAY_RETURN_URL,
      ipn_url: process.env.SEPAY_IPN_URL,
      buyer_name: 'Demo',
      buyer_email: 'demo@example.com',
      buyer_phone: '0900000000'
    };
    const sorted = Object.keys(payload).sort().map(k => `${k}=${payload[k]}`).join('&');
    const signature = crypto.createHmac('sha256', process.env.SEPAY_SECRET_KEY)
      .update(sorted)
      .digest('hex');

    const orderCreateUrl = new URL('/pg/v1/order/create', SEPAY_API_BASE_URL).toString();
    const { data } = await axios.post(orderCreateUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        signature
      }
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
