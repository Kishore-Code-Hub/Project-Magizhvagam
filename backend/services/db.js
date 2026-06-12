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
      
      // Auto-seed or verify development admin account
      try {
        const User = require('../models/User');
        const adminEmail = 'admin@magizhvagam.com';
        let admin = await User.findOne({ email: adminEmail });
        
        if (!admin) {
          console.log(`Admin user ${adminEmail} does not exist. Seeding default admin...`);
          await User.create({
            name: 'Magizhvagam Admin',
            email: adminEmail,
            password: 'admin123',
            role: 'admin',
            emailVerified: true,
            phoneVerified: true,
            addresses: [{
              fullName: 'Admin Main Office',
              phone: '9876543210',
              street: '12 Luxury Palace St',
              city: 'Chennai',
              state: 'Tamil Nadu',
              zipCode: '600001',
              country: 'India'
            }]
          });
          console.log('Admin user seeded successfully with password admin123!');
        } else {
          admin.role = 'admin';
          admin.password = 'admin123';
          await admin.save();
          console.log('Admin user exists. Password verified/reset to admin123.');
        }
      } catch (seedErr) {
        console.error('Failed to seed/verify admin user:', seedErr.message);
      }

      return conn;
    } catch (error) {
      console.error(`CRITICAL: MongoDB connection failed: ${error.message}`);
      console.log('Retrying connection automatically in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
