const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        
        // Fix Bills collection
        console.log('Fixing Bills indexes...');
        const billCollections = await db.listCollections({ name: 'bills' }).toArray();
        if (billCollections.length > 0) {
            try {
                // Drop the old global unique index on billNumber if it exists
                // Mongoose usually names it 'billNumber_1'
                await db.collection('bills').dropIndex('billNumber_1');
                console.log('Dropped global billNumber_1 index from bills');
            } catch (e) {
                console.log('billNumber_1 index not found or already dropped');
            }
        }

        // Fix Products collection
        console.log('Fixing Products indexes...');
        const productCollections = await db.listCollections({ name: 'products' }).toArray();
        if (productCollections.length > 0) {
            try {
                // Drop the old global unique index on sku if it exists
                await db.collection('products').dropIndex('sku_1');
                console.log('Dropped global sku_1 index from products');
            } catch (e) {
                console.log('sku_1 index not found or already dropped');
            }
        }

        console.log('Index cleanup complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing indexes:', err);
        process.exit(1);
    }
}

fixIndexes();
