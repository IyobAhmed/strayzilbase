class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({ error: err.message, stack: err.stack, status: err.statusCode });
  }
  if (err.isOperational) return res.status(err.statusCode).json({ error: err.message });
  console.error('ERROR:', err);
  res.status(500).json({ error: 'Something went wrong' });
};

module.exports = { AppError, errorHandler };
