// config/db.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // PHẢI là service key!

if (!key) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Parse JWT để chắc chắn là service_role, tránh lẫn anon
const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf8'));
if (payload.role !== 'service_role') {
  throw new Error(`Wrong Supabase key on server. Expected service_role, got: ${payload.role}`);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = supabase;
