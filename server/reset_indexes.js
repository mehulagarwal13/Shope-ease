const mongoose = require('mongoose');
require('dotenv').config();

async function resetAllIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        const collections = ['bills', 'products'];
        for (const col of collections) {
            console.log(`Resetting all indexes for ${col}...`);
            const indexes = await db.collection(col).indexes();
            for (const idx of indexes) {
                if (idx.name === '_id_') continue;
                console.log(`Dropping ${idx.name} from ${col}`);
                await db.collection(col).dropIndex(idx.name);
            }
        }
        console.log('Reset complete! Restarting the server will recreate them from the current schema.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
resetAllIndexes();
