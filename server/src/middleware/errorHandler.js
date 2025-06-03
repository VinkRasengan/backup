const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500,
    code: err.code || 'INTERNAL_ERROR'
  };

  // Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    error.status = 400;
    error.code = 'FIREBASE_AUTH_ERROR';
    
    switch (err.code) {
      case 'auth/email-already-exists':
        error.message = 'Email already registered';
        error.code = 'EMAIL_EXISTS';
        break;
      case 'auth/invalid-email':
        error.message = 'Invalid email address';
        error.code = 'INVALID_EMAIL';
        break;
      case 'auth/user-not-found':
        error.message = 'User not found';
        error.code = 'USER_NOT_FOUND';
        break;
      case 'auth/wrong-password':
        error.message = 'Invalid credentials';
        error.code = 'INVALID_CREDENTIALS';
        break;
      default:
        error.message = 'Authentication error';
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    error.message = err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.code = 'INVALID_TOKEN';
    error.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    error.status = 401;
    error.code = 'TOKEN_EXPIRED';
    error.message = 'Token expired';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Internal Server Error';
  }

  res.status(error.status).json({
    error: error.message,
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
