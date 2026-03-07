require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create or find demo user
    let user = await User.findOne({ email: 'demo@shopease.com' });
    if (!user) {
        const hashedPassword = await bcrypt.hash('demo1234', 12);
        user = await User.create({
            shopName: 'ShopEase Demo Store',
            ownerName: 'Demo Owner',
            email: 'demo@shopease.com',
            password: hashedPassword,
            phone: '9876543210',
            address: '123 Market Street, Mumbai',
            gstNumber: 'GST27ABCDE1234F1Z5'
        });
        console.log('✅ Demo user created — email: demo@shopease.com | password: demo1234');
    }

    await Product.deleteMany({ userId: user._id });

    const products = [
        { productName: 'Paracetamol 500mg', companyName: 'Sun Pharma', category: 'Pharma', quantity: 150, pricePerUnit: 12, sellingPrice: 20, gstPercent: 5, lowStockThreshold: 20 },
        { productName: 'Dettol Soap 100g', companyName: 'Reckitt', category: 'FMCG', quantity: 80, pricePerUnit: 30, sellingPrice: 45, gstPercent: 18, lowStockThreshold: 15 },
        { productName: 'Colgate Toothpaste', companyName: 'Colgate', category: 'FMCG', quantity: 60, pricePerUnit: 55, sellingPrice: 80, gstPercent: 18, lowStockThreshold: 10 },
        { productName: 'Amul Butter 500g', companyName: 'Amul', category: 'Grocery', quantity: 25, pricePerUnit: 220, sellingPrice: 260, gstPercent: 12, lowStockThreshold: 10, expiryDate: new Date('2026-06-30') },
        { productName: 'Lay\'s Chips Classic', companyName: "Frito-Lay", category: 'Grocery', quantity: 120, pricePerUnit: 15, sellingPrice: 20, gstPercent: 12, lowStockThreshold: 20 },
        { productName: 'USB-C Cable 1m', companyName: 'Portronics', category: 'Electronics', quantity: 35, pricePerUnit: 120, sellingPrice: 199, gstPercent: 18, lowStockThreshold: 5 },
        { productName: 'Power Bank 10000mAh', companyName: 'Ambrane', category: 'Electronics', quantity: 8, pricePerUnit: 650, sellingPrice: 999, gstPercent: 18, lowStockThreshold: 5 },
        { productName: 'Tata Salt 1kg', companyName: 'Tata', category: 'Grocery', quantity: 200, pricePerUnit: 18, sellingPrice: 24, gstPercent: 0, lowStockThreshold: 30 },
        { productName: 'Crocin Syrup 60ml', companyName: 'GSK', category: 'Pharma', quantity: 6, pricePerUnit: 48, sellingPrice: 72, gstPercent: 5, lowStockThreshold: 10, expiryDate: new Date('2026-12-31') },
        { productName: 'Cotton T-Shirt M', companyName: 'Jockey', category: 'Clothing', quantity: 15, pricePerUnit: 250, sellingPrice: 450, gstPercent: 5, lowStockThreshold: 5 }
    ];

    for (const p of products) {
        await new Product({ userId: user._id, ...p }).save();
    }

    console.log(`✅ Seeded ${products.length} demo products`);
    await mongoose.disconnect();
    console.log('Done!');
};

seed().catch(err => { console.error(err); process.exit(1); });
