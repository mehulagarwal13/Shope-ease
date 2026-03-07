const Product = require('../models/Product');

// GET /api/products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error('getProducts error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/products/low-stock
const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({ userId: req.user.id }).lean();
        const lowStock = products.filter(p => p.quantity <= p.lowStockThreshold);
        res.json(lowStock);
    } catch (err) {
        console.error('getLowStockProducts error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/products
const addProduct = async (req, res) => {
    try {
        const {
            productName, companyName, category, sku, quantity,
            pricePerUnit, sellingPrice, gstPercent, expiryDate, lowStockThreshold
        } = req.body;

        if (!productName || !companyName || !category || quantity === undefined || !pricePerUnit || !sellingPrice) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        // Validate gstPercent is one of allowed values
        const allowedGst = [0, 5, 12, 18, 28];
        const gstVal = Number(gstPercent) || 0;
        if (!allowedGst.includes(gstVal)) {
            return res.status(400).json({ message: `GST must be one of: ${allowedGst.join(', ')}` });
        }

        const productData = {
            userId: req.user.id,
            productName: productName.trim(),
            companyName: companyName.trim(),
            category,
            quantity: Number(quantity),
            pricePerUnit: Number(pricePerUnit),
            sellingPrice: Number(sellingPrice),
            gstPercent: gstVal,
            lowStockThreshold: Number(lowStockThreshold) || 10
        };

        // Only add sku / expiryDate if they have real values
        const skuClean = typeof sku === 'string' ? sku.trim() : '';
        if (skuClean) productData.sku = skuClean;
        if (expiryDate) productData.expiryDate = new Date(expiryDate);

        const product = new Product(productData);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        console.error('addProduct error:', err.message, err.errors);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'SKU already exists, use a unique SKU' });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({ message: messages });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, userId: req.user.id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const fields = ['productName', 'companyName', 'category', 'quantity', 'pricePerUnit', 'sellingPrice', 'gstPercent', 'lowStockThreshold'];
        fields.forEach(f => {
            if (req.body[f] !== undefined) product[f] = req.body[f];
        });

        // Handle sku — only set if non-empty
        if (req.body.sku !== undefined) {
            const skuClean = typeof req.body.sku === 'string' ? req.body.sku.trim() : '';
            product.sku = skuClean || undefined;
        }

        // Handle expiryDate
        if (req.body.expiryDate !== undefined) {
            product.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : undefined;
        }

        await product.save();
        res.json(product);
    } catch (err) {
        console.error('updateProduct error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'SKU already exists' });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({ message: messages });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('deleteProduct error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getProducts, getLowStockProducts, addProduct, updateProduct, deleteProduct };
