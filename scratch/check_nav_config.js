const mongoose = require('mongoose');
const connectDB = require('../backend/services/db');
const NavigationConfig = require('../backend/models/NavigationConfig');

async function check() {
  await connectDB();
  const doc = await NavigationConfig.findOne({ _id: 'active' });
  console.log('ACTIVE NAV CONFIG:');
  console.log(JSON.stringify(doc, null, 2));
  mongoose.connection.close();
}

check();
