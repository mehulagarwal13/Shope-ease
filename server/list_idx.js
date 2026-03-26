const mongoose = require('mongoose');
require('dotenv').config();

async function list() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const colNames = ['bills', 'products'];
        for (const name of colNames) {
            console.log(`-- ${name} --`);
            const indexes = await db.collection(name).indexes();
            indexes.forEach(i => console.log(i.name, i.key, i.unique));
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
list();
