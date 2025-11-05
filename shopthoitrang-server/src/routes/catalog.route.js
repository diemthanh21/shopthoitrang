const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/catalog.controller');

// Require auth like other product routes
router.use(authenticateToken);

/**
 * GET /api/catalog/products
 * Query params:
 *  - categoryName: string (tendanhmuc ilike)
 *  - minPrice, maxPrice: number (lọc theo chitietsanpham.giaban)
 *  - onlyFiveStar: boolean ('true'|'false') sản phẩm có ít nhất 1 đánh giá 5 sao
 *  - limit, offset: number
 */
router.get('/products', ctrl.listProducts);

// Count products for pagination with the same filters
router.get('/products/count', ctrl.countProducts);

module.exports = router;
