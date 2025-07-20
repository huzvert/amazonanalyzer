const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'adbms_schema';

async function init() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);

        const collectionsToCreate = [
            'products',
            'reviews',
            'searches'
        ];

        const existingCollections = await db.listCollections().toArray();
        const existingNames = existingCollections.map(c => c.name);

        for (const name of collectionsToCreate) {
            if (!existingNames.includes(name)) {
                await db.createCollection(name);
                console.log(`Created collection: ${name}`);
            } else {
                console.log(`Collection already exists: ${name}`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

init();
