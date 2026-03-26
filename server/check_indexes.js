const mongoose = require('mongoose');
require('dotenv').config();

async function checkIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        console.log('--- Bills Indexes ---');
        try {
            const billIndexes = await db.collection('bills').indexes();
            console.log(JSON.stringify(billIndexes, null, 2));
        } catch (e) { console.log('Error reading bills indexes:', e.message); }

        console.log('--- Products Indexes ---');
        try {
            const productIndexes = await db.collection('products').indexes();
            console.log(JSON.stringify(productIndexes, null, 2));
        } catch (e) { console.log('Error reading products indexes:', e.message); }

        process.exit(0);
    } catch (err) {
        console.error('Error checking indexes:', err);
        process.exit(1);
    }
}
checkIndexes();
