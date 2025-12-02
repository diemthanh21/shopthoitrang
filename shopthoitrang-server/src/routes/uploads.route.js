const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticateToken = require('../middlewares/auth.middleware');
const storageService = require('../services/storage.service');

// Use memory storage so we can upload buffer directly to Supabase
// Set high fileSize limit (30MB) to allow single video uploads; we'll validate types/sizes below
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

// POST /api/uploads/return-media
// headers: Authorization: Bearer <token>
// form-data: file (binary), orderId (string or number)
router.post('/return-media', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Missing file' });
    const orderId = req.body.orderId;
    if (!orderId) return res.status(400).json({ message: 'Missing orderId in form data' });

    const originalName = req.file.originalname || 'file.bin';
    const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const ext = (safeName.split('.').pop() || 'jpg').toLowerCase();
    const now = Date.now();
    const objectPath = `${orderId}/${now}_${safeName}`;

    // Validate type and size: images (jpg/png/webp/gif) max 5MB; video (mp4/mov/avi/mkv/webm) max 30MB
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    const size = req.file.size || 0;
    if (imageExts.includes(ext)) {
      if (size > 5 * 1024 * 1024) return res.status(400).json({ message: 'Image too large (max 5MB).' });
    } else if (videoExts.includes(ext)) {
      if (size > 30 * 1024 * 1024) return res.status(400).json({ message: 'Video too large (max 30MB).' });
    } else {
      return res.status(400).json({ message: 'Unsupported file type.' });
    }

    const bucket = process.env.RETURN_MEDIA_BUCKET || 'trahang_hinh';
    const contentType = req.file.mimetype || 'application/octet-stream';

    const data = await storageService.uploadReturnMedia(bucket, objectPath, req.file.buffer, contentType);

    // Return public URL
    const { data: { publicUrl } } = await require('../../config/db')
      .storage
      .from(bucket)
      .getPublicUrl(objectPath);
    
    return res.json({ path: objectPath, url: publicUrl });
  } catch (err) {
    console.error('[Uploads] upload error', err);
    return res.status(500).json({ message: 'Upload failed', detail: err.message || err.toString() });
  }
});

module.exports = router;