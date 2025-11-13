const router = require('express').Router();
const ctrl = require('../controllers/kichthuoc.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
