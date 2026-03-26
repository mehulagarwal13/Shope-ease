const mongoose = require('mongoose');
require('dotenv').config();

async function bruteForceClean() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        const collections = ['bills', 'products'];
        for (const col of collections) {
            console.log(`Searching indexes for ${col}...`);
            const indexes = await db.collection(col).indexes();
            for (const idx of indexes) {
                const keys = Object.keys(idx.key);
                // If it's a global unique index on billNumber or sku
                if (idx.unique && keys.length === 1 && (keys[0] === 'billNumber' || keys[0] === 'sku')) {
                    console.log(`Found problematic global index: ${idx.name} on ${col}. DROPPING IT NOW.`);
                    await db.collection(col).dropIndex(idx.name);
                }
            }
        }
        console.log('Done cleaning!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
bruteForceClean();
