const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');

    const admin = new mongoose.mongo.Admin(mongoose.connection.db);
    const result = await admin.listDatabases();
    console.log('Databases:', result.databases.map(d => d.name));

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in current db:', collections.map(c => c.name));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
