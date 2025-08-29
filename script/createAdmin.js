import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const adminData = {
      username: 'admin',
      password: 'admin123' // Change this to a stronger password in production
    };

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: adminData.username });
    if (existingAdmin) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin(adminData);
    await admin.save();

    console.log('Admin account created successfully!');
    console.log(`Username: ${adminData.username}`);
    console.log(`Password: ${adminData.password}`);

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};


createAdmin();
