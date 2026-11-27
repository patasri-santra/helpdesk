const env = require('../config/env');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();
  const email = (process.env.ADMIN_EMAIL || 'admin@helpdesk.com').toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'ADMIN',
    });
    console.log(`Admin created: ${email}`);
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
