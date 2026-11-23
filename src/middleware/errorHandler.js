import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode ?? 500;
  let message = err.message || 'Internal server error';
  let errors;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Validation error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  } else if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value: ${field} already exists`;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed';
    errors = err.errors;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(config.isDevelopment && err.stack && { stack: err.stack }),
  });
}
