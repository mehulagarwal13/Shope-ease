const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createBill, getBills, getBillById, getTodayStats, deleteBill } = require('../controllers/billController');

router.get('/stats/today', protect, getTodayStats);
router.get('/', protect, getBills);
router.post('/', protect, createBill);
router.get('/:id', protect, getBillById);
router.delete('/:id', protect, deleteBill);

module.exports = router;
