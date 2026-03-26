const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['Electronics', 'FMCG', 'Pharma', 'Clothing', 'Grocery', 'Other']
    },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, default: 0, enum: [0, 5, 12, 18, 28] },
    expiryDate: { type: Date },
    lowStockThreshold: { type: Number, default: 10 },
    createdAt: { type: Date, default: Date.now }
});

// Compound unique indexes per user
productSchema.index({ userId: 1, sku: 1 }, { unique: true, sparse: true });
productSchema.index({ userId: 1, productName: 1, companyName: 1 }, { unique: true });

// Auto-generate SKU before saving (Robust against deletions)
productSchema.pre('save', async function (next) {
    if (!this.sku) {
        try {
            const lastProduct = await mongoose.model('Product')
                .findOne({ userId: this.userId })
                .sort({ createdAt: -1 });

            let nextNum = 1;
            if (lastProduct && lastProduct.sku) {
                // Extract number from last SKU (e.g., "SKU-0010" -> 10)
                const match = lastProduct.sku.match(/SKU-(\d+)/);
                if (match) {
                    nextNum = parseInt(match[1]) + 1;
                }
            }
            this.sku = `SKU-${String(nextNum).padStart(4, '0')}`;
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

module.exports = mongoose.model('Product', productSchema);
