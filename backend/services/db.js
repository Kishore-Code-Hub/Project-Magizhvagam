const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const connStr = process.env.MONGODB_URI;
  if (!connStr) {
    console.error('CRITICAL: MONGODB_URI environment variable is missing from your .env configuration.');
    process.exit(1);
  }

  console.log('Initiating connection to MongoDB Atlas...');
  
  while (true) {
    try {
      const conn = await mongoose.connect(connStr, {
        serverSelectionTimeoutMS: 5000 // Fail fast (5s) to trigger retry loop
      });
      console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`CRITICAL: MongoDB connection failed: ${error.message}`);
      console.log('Retrying connection automatically in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
