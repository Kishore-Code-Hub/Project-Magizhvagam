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
              fullName: 'Magizhvagam',
              phone: '9894086929',
              city: 'Chennai',
              state: 'Tamil Nadu'
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

      // Auto-seed active footer configuration if not present (does not overwrite existing)
      try {
        const FooterConfig = require('../models/FooterConfig');
        const existingFooter = await FooterConfig.findOne({ _id: 'active' });
        if (!existingFooter) {
          console.log('Active footer configuration not found. Seeding default footer config...');
          await FooterConfig.create({ _id: 'active' });
          console.log('Default footer configuration seeded successfully.');
        } else {
          console.log('Active footer configuration exists. Skipped seeding to preserve customizations.');
        }
      } catch (footerSeedErr) {
        console.error('Failed to seed active footer configuration:', footerSeedErr.message);
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
