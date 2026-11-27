const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const notFound = (req, _res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));

const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err.name === 'CastError') { status = 400; message = 'Invalid id'; }
  else if (err.code === 11000) { status = 409; message = 'A record with that value already exists'; }
  else if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON body'; }
  else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  if (status >= 500) {
    console.error(err);
    if (env.nodeEnv === 'production') message = 'Internal server error';
  }

  res.status(status).json({ success: false, message, ...(details && { details }) });
};

module.exports = { notFound, errorHandler };
