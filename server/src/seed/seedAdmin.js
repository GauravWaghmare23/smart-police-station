import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ROLES, USER_STATUS } from '../utils/constants.js';

const seedAdmin = async () => {
  await connectDB();
  
  try {
    const adminExists = await User.findOne({ email: env.admin.email });
    
    if (adminExists) {
      console.log(`Admin user with email ${env.admin.email} already exists.`);
      process.exit(0);
    }
    
    await User.create({
      name: env.admin.name,
      email: env.admin.email,
      phone: '9999999999',
      password: env.admin.password,
      role: ROLES.CONTROL_ROOM_ADMIN,
      status: USER_STATUS.ACTIVE
    });
    
    console.log('Control Room Admin seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
