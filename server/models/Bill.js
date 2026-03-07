const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    companyName: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    gstPercent: { type: Number, default: 0 },
    subtotal: { type: Number, required: true }
}, { _id: false });

const billSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    billNumber: { type: String, unique: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    items: [billItemSchema],
    subtotalAmount: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMode: {
        type: String,
        enum: ['Cash', 'UPI', 'Card', 'Credit'],
        default: 'Cash'
    },
    createdAt: { type: Date, default: Date.now }
});

// Auto-generate bill number before saving
billSchema.pre('save', async function () {
    if (!this.billNumber) {
        const count = await mongoose.model('Bill').countDocuments({ userId: this.userId });
        this.billNumber = `BILL-${String(count + 1).padStart(4, '0')}`;
    }
});

module.exports = mongoose.model('Bill', billSchema);
