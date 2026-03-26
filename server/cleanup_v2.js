const mongoose = require('mongoose');
require('dotenv').config();

async function cleanUp() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        const collections = ['bills', 'products'];
        for (const colName of collections) {
            console.log(`Checking collection: ${colName}`);
            const indexes = await db.collection(colName).indexes();
            for (const idx of indexes) {
                if (idx.name === '_id_') continue;
                
                // If it's a single field unique index, it's likely the old global one
                // Global billNumber: { billNumber: 1 }
                // Global SKU: { sku: 1 }
                const keys = Object.keys(idx.key);
                if (keys.length === 1 && idx.unique) {
                    if (keys[0] === 'billNumber' || keys[0] === 'sku') {
                        console.log(`Dropping global unique index: ${idx.name} from ${colName}`);
                        await db.collection(colName).dropIndex(idx.name);
                    }
                }
            }
        }
        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
cleanUp();
