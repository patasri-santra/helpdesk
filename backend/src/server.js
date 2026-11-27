const env = require('./config/env');
const connectDB = require('./config/db');

if (!env.jwtSecret) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = require('./app');

connectDB()
  .then(() => app.listen(env.port, () => console.log(`API running on port ${env.port}`)))
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
