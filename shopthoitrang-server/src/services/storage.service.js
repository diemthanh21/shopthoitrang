const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Storage service may fail.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function uploadReturnMedia(bucket, path, buffer, contentType = 'application/octet-stream') {
  // buffer is expected to be a Buffer (from multer memoryStorage)
  const options = { contentType, upsert: true };
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, options);
  if (error) {
    const err = new Error(error.message || 'Unknown storage error');
    err.status = error.status || 500;
    throw err;
  }
  // data may contain a 'path' field
  return data;
}

module.exports = { uploadReturnMedia };
