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
    sku: { type: String, unique: true, sparse: true },
    quantity: { type: Number, required: true, min: 0 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, default: 0, enum: [0, 5, 12, 18, 28] },
    expiryDate: { type: Date },
    lowStockThreshold: { type: Number, default: 10 },
    createdAt: { type: Date, default: Date.now }
});

// Auto-generate SKU before saving
productSchema.pre('save', async function () {
    if (!this.sku) {
        const count = await mongoose.model('Product').countDocuments({ userId: this.userId });
        this.sku = `SKU-${String(count + 1).padStart(4, '0')}`;
    }
});

module.exports = mongoose.model('Product', productSchema);
