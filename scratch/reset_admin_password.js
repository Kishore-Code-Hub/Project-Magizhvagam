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

    const admin = await User.findOne({ email: 'admin@magizhvagam.com' });
    if (admin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      admin.passwordHash = passwordHash;
      await admin.save();
      console.log('Updated password for admin@magizhvagam.com to: admin123');
    } else {
      console.log('Admin not found.');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
