import { RequestHandler } from 'express';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';

export const authorize =
  (...roles: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
