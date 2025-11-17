const router = require('express').Router();
const crypto = require('crypto');
const axios = require('axios');

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

    const { data } = await axios.post('https://api.sepay.vn/pg/v1/order/create', payload, {
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
