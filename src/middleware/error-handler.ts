import { ErrorRequestHandler } from 'express';
import { ApiError } from '@/lib/errors';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' },
  });
};
