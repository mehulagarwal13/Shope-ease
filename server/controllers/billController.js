const Bill = require('../models/Bill');
const Product = require('../models/Product');

// POST /api/bills — Create bill + auto-deduct stock (no session required)
const createBill = async (req, res) => {
    try {
        const { customerName, customerPhone, items, discountAmount, paymentMode } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Bill must have at least one item' });
        }

        // Validate stock availability and compute totals
        let subtotalAmount = 0;
        let gstAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findOne({ _id: item.productId, userId: req.user.id });
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.productName}` });
            }
            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for "${product.productName}". Available: ${product.quantity}`
                });
            }

            const itemSubtotal = item.unitPrice * item.quantity;
            const itemGst = (itemSubtotal * (product.gstPercent || 0)) / 100;
            subtotalAmount += itemSubtotal;
            gstAmount += itemGst;

            processedItems.push({
                productId: product._id,
                productName: product.productName,
                companyName: product.companyName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                gstPercent: product.gstPercent || 0,
                subtotal: itemSubtotal
            });
        }

        const discount = Number(discountAmount) || 0;
        const grandTotal = subtotalAmount + gstAmount - discount;

        // Create the bill first
        const bill = new Bill({
            userId: req.user.id,
            customerName,
            customerPhone,
            items: processedItems,
            subtotalAmount,
            gstAmount,
            discountAmount: discount,
            grandTotal,
            paymentMode: paymentMode || 'Cash'
        });

        await bill.save();

        // Deduct stock for each item after bill is saved
        for (const item of processedItems) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { quantity: -item.quantity } }
            );
        }

        res.status(201).json(bill);
    } catch (err) {
        console.error('createBill error:', err);
        
        // Handle duplicate key error (E11000)
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field';
            return res.status(409).json({
                message: `Constraint violation: Duplicate ${field} detected.`
            });
        }

        res.status(500).json({ 
            message: 'Server error', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        });
    }
};

// GET /api/bills
const getBills = async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        let query = { userId: req.user.id };

        if (search) {
            query.$or = [
                { billNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const bills = await Bill.find(query).sort({ createdAt: -1 });
        res.json(bills);
    } catch (err) {
        console.error('getBills error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/bills/:id
const getBillById = async (req, res) => {
    try {
        const bill = await Bill.findOne({ _id: req.params.id, userId: req.user.id });
        if (!bill) return res.status(404).json({ message: 'Bill not found' });
        res.json(bill);
    } catch (err) {
        console.error('getBillById error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/bills/stats/today
const getTodayStats = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const bills = await Bill.find({
            userId: req.user.id,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const totalBillsToday = bills.length;
        const totalRevenueToday = bills.reduce((sum, b) => sum + b.grandTotal, 0);

        res.json({ totalBillsToday, totalRevenueToday });
    } catch (err) {
        console.error('getTodayStats error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/bills/:id — Delete bill and restore stock
const deleteBill = async (req, res) => {
    try {
        const bill = await Bill.findOne({ _id: req.params.id, userId: req.user.id });
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Restore stock for each item in the bill
        for (const item of bill.items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { quantity: item.quantity } }
            );
        }

        await Bill.findByIdAndDelete(req.params.id);

        res.json({ message: 'Bill deleted and stock restored' });
    } catch (err) {
        console.error('deleteBill error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { createBill, getBills, getBillById, getTodayStats, deleteBill };
