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
    billNumber: { type: String },
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

// Add compound index to make billNumber unique per user
billSchema.index({ userId: 1, billNumber: 1 }, { unique: true });

// Auto-generate bill number before saving (Robust against deletions)
billSchema.pre('save', async function (next) {
    if (!this.billNumber) {
        try {
            const lastBill = await mongoose.model('Bill')
                .findOne({ userId: this.userId })
                .sort({ createdAt: -1 });

            let nextNum = 1;
            if (lastBill && lastBill.billNumber) {
                // Extract number from last bill (e.g., "BILL-0010" -> 10)
                const match = lastBill.billNumber.match(/BILL-(\d+)/);
                if (match) {
                    nextNum = parseInt(match[1]) + 1;
                }
            }
            this.billNumber = `BILL-${String(nextNum).padStart(4, '0')}`;
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

module.exports = mongoose.model('Bill', billSchema);
