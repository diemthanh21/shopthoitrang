const crypto = require('crypto');
const axios = require('axios');
const donhangRepository = require('../repositories/donhang.repository');

const MOMO_CREATE_URL = process.env.MOMO_CREATE_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';
const MOMO_QUERY_URL = process.env.MOMO_QUERY_URL || 'https://test-payment.momo.vn/v2/gateway/api/query';

const normalize = v => (v || '').toString().trim();

function buildSignature(raw, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(raw).digest('hex');
}

function buildRawData({ accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, redirectUrl, requestId, requestType, }) {
  const parts = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ];
  return parts.join('&');
}

// TTL in ms (extended to 10 minutes to give IPN more time)
const MOMO_QR_TTL_MS = 10 * 60 * 1000;

async function createPaymentForOrder(orderId, { forceRefresh = false } = {}) {
  const partnerCode = normalize(process.env.MOMO_PARTNER_CODE || 'MOMO');
  const accessKey = normalize(process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85');
  const secretKey = normalize(process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz');
  // For mobile app flow, default redirect back to app scheme (can be overridden by env)
  const redirectUrl = normalize(process.env.MOMO_REDIRECT_URL || 'shopthoitrang://momo-callback');
  // Compute a safer default IPN URL pointing to our server if not configured.
  // Ưu tiên APP_BASE_URL/BASE_URL/RENDER_EXTERNAL_URL, nếu không có thì fallback
  // thẳng sang domain Render hiện tại của dự án: https://elora-s2rc.onrender.com
  const baseFromEnv = normalize(
    process.env.APP_BASE_URL ||
    process.env.BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.VERCEL_URL ||
    'https://elora-s2rc.onrender.com'
  );
  const normalizedBase = baseFromEnv.startsWith('http') ? baseFromEnv : `https://${baseFromEnv}`;
  const computedIpn = `${normalizedBase.replace(/\/$/, '')}/api/momo/ipn`;
  const ipnUrl = normalize(process.env.MOMO_IPN_URL || computedIpn);

  if (!partnerCode || !accessKey || !secretKey) {
    const e = new Error('MoMo credentials are not configured');
    e.status = 500;
    throw e;
  }

  const order = await donhangRepository.getById(orderId);
  if (!order) {
    const e = new Error('Order not found');
    e.status = 404;
    throw e;
  }
  const orderJson = order.toJSON();

  // If existing MOMO session still valid and not forcing refresh, reuse
  if (!forceRefresh && orderJson.momo_qr_code_url && orderJson.momo_expires_at) {
    try {
      const expiresAtTs = Date.parse(orderJson.momo_expires_at);
      if (!Number.isNaN(expiresAtTs) && expiresAtTs > Date.now()) {
        return {
          reused: true,
          payUrl: orderJson.momo_qr_code_url, // assuming qrCodeUrl can be used as deep link/payUrl
          qrCodeUrl: orderJson.momo_qr_code_url,
          resultCode: 0,
          message: 'Existing MoMo session still valid',
          orderId: orderJson.momo_order_id,
          requestId: orderJson.momo_request_id,
          expiresAt: orderJson.momo_expires_at,
        };
      }
    } catch (_) { /* ignore parse errors */ }
  }
  const amount = Math.round(Number(orderJson.thanhtien) || 0);
  if (!amount || amount <= 0) {
    const e = new Error('Order amount is invalid');
    e.status = 400;
    throw e;
  }

  const now = Date.now();
  const requestId = `${orderId}-${now}`; // must be unique per request
  const momoOrderId = `${orderId}-${now}`; // keep orderId unique as well to avoid MoMo duplicate errors
  const payloadBase = {
    partnerCode,
    accessKey,
    requestId,
    amount: String(amount),
    orderId: String(momoOrderId),
    orderInfo: `Thanh toan don hang #${orderId}`,
    redirectUrl,
    ipnUrl,
    extraData: '',
    requestType: 'captureWallet',
  };

  const raw = buildRawData({ ...payloadBase });
  const signature = buildSignature(raw, secretKey);

  const body = { ...payloadBase, signature, lang: 'vi' };

    let data;
    try {
      const resp = await axios.post(MOMO_CREATE_URL, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      console.log('[MoMo] createPaymentForOrder response status:', resp.status);
      console.log('[MoMo] createPaymentForOrder response data:', JSON.stringify(resp.data));
      data = resp.data;
    } catch (err) {
      console.error('[MoMo] createPaymentForOrder error:', err?.response?.data || err?.message || err);
      throw err;
    }
  // Compute expiry timestamp (ISO)
  const expiresAt = new Date(Date.now() + MOMO_QR_TTL_MS).toISOString();

  // Persist session data for reuse within TTL
  try {
    await donhangRepository.update(orderId, {
      momo_order_id: String(momoOrderId),
      momo_request_id: String(requestId),
      momo_qr_code_url: data.qrCodeUrl || data.payUrl || data.shortLink || data.deeplink || null,
      momo_expires_at: expiresAt,
    });
  } catch (persistErr) {
    console.warn('[MoMo] Failed to persist session data', persistErr?.message || persistErr);
  }

  return { ...data, expiresAt, momo_order_id: momoOrderId, momo_request_id: requestId }; // expect fields: payUrl, deeplink, qrCodeUrl, resultCode
}

function verifyIpnSignature(payload) {
  const accessKey = normalize(process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85');
  const secretKey = normalize(process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz');

  // MoMo IPN raw signature order (per docs v2)
  const fields = [
    'accessKey', 'amount', 'extraData', 'message', 'orderId', 'orderInfo', 'orderType', 'partnerCode', 'payType', 'requestId', 'responseTime', 'resultCode', 'transId'
  ];

  const data = {};
  for (const k of fields) data[k] = payload[k] ?? '';
  data.accessKey = accessKey; // ensure same accessKey used

  const raw = fields.map(k => `${k}=${data[k]}`).join('&');
  const expected = buildSignature(raw, secretKey);
  return String(expected) === String(payload.signature || '');
}

// Query MoMo transaction status for a given orderId (MoMo-composed id)
async function queryTransaction({ orderId, requestId }) {
  const partnerCode = normalize(process.env.MOMO_PARTNER_CODE || 'MOMO');
  const accessKey = normalize(process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85');
  const secretKey = normalize(process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz');

  if (!partnerCode || !accessKey || !secretKey) {
    const e = new Error('MoMo credentials are not configured');
    e.status = 500;
    throw e;
  }

  const reqId = requestId || `${orderId}-${Date.now()}`;
  // Signature for query (per MoMo v2 docs)
  const raw = [`accessKey=${accessKey}`, `orderId=${orderId}`, `partnerCode=${partnerCode}`, `requestId=${reqId}`].join('&');
  const signature = buildSignature(raw, secretKey);
  const body = { partnerCode, accessKey, requestId: reqId, orderId: String(orderId), lang: 'vi', signature };

  const { data } = await axios.post(MOMO_QUERY_URL, body, { headers: { 'Content-Type': 'application/json' } });
  return data; // contains resultCode, message, transId, amount, payType, etc.
}

module.exports = {
  createPaymentForOrder,
  verifyIpnSignature,
  queryTransaction,
};
