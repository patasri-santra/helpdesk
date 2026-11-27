const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const { registerEventHandlers } = require('./events/handlers');

registerEventHandlers();

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.clientUrl.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '10kb' }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

const limiter = (max) => rateLimit({
  windowMs: 15 * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/auth', limiter(env.nodeEnv === 'test' ? 1000 : 30));
app.use('/api', limiter(env.nodeEnv === 'test' ? 10000 : 500));

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
