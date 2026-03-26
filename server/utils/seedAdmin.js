/**
 * Seed script: creates the main admin user if not already present.
 * Run with: node server/utils/seedAdmin.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'javzdev@gmail.com';
const ADMIN_PASSWORD = 'JavzDevarez16_';
const ADMIN_USERNAME = 'javzdev';

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpromts', {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    console.log('Connected to MongoDB.');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log(`User ${ADMIN_EMAIL} already existed — updated role to admin.`);
      } else {
        console.log(`Admin user ${ADMIN_EMAIL} already exists with role admin. Nothing to do.`);
      }
      return;
    }

    const admin = new User({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isActive: true,
      emailVerified: true
    });

    await admin.save();
    console.log(`✅ Admin user created successfully!`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Role: admin`);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedAdmin();
