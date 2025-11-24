const crypto = require('crypto');
(async () => {
  try {
    const payload = {
      merchant_id: 'SP-LIVE-TT928438',
      order_code: 'UNITTEST-' + Date.now(),
      amount: 100000,
      currency: 'VND',
      description: 'Test payment',
      return_url: 'https://elora-s2rc.onrender.com/payment/return',
      ipn_url: 'https://elora-s2rc.onrender.com/api/sepay/ipn',
      buyer_name: 'Demo',
      buyer_email: 'demo@example.com',
      buyer_phone: '0900000000'
    };
    const sorted = Object.keys(payload).sort().map(k => k + '=' + payload[k]).join('&');
    const signature = crypto.createHmac('sha256', 'spsk_live_MNwKAeuippFTETyJqaXe6RDo4nJzjEGk').update(sorted).digest('hex');
    const response = await fetch('https://pgapi.sepay.vn/pg/v1/order/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        signature
      },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    console.log('status', response.status);
    console.log(text);
  } catch (err) {
    console.error(err);
  }
})();
