const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/thethanhvien.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

router.get('/', ctrl.getAll);
router.get('/khachhang/:makhachhang', ctrl.getByKhachHang);
router.get('/:id', ctrl.getById);
router.post('/sync', ctrl.syncAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
