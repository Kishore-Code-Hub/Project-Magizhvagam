const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'customer' }
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected.');

    const admins = await User.find({ role: 'admin' });
    if (admins.length > 0) {
      console.log('Admin accounts found:');
      admins.forEach(admin => {
        console.log(`- Name: ${admin.name}, Email: ${admin.email}`);
      });
    } else {
      console.log('No admin accounts found. Creating default admin...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      const defaultAdmin = new User({
        name: 'Shield Admin',
        email: 'admin@magizhvagam.com',
        passwordHash: passwordHash,
        role: 'admin'
      });
      await defaultAdmin.save();
      console.log('Created admin@magizhvagam.com with password: admin123');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
