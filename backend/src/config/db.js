const mongoose = require('mongoose');
const env = require('./env');

async function connectDB(uri = env.mongoUri) {
  if (!uri) throw new Error('MONGO_URI is not set');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = connectDB;
