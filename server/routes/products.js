const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getProducts, getLowStockProducts, addProduct, updateProduct, deleteProduct
} = require('../controllers/productController');

router.get('/low-stock', protect, getLowStockProducts);
router.get('/', protect, getProducts);
router.post('/', protect, addProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
