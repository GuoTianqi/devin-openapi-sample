import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@/lib/errors';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

const isAuthenticatedUser = (payload: unknown): payload is AuthenticatedUser => {
  if (typeof payload !== 'object' || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string'
  );
};

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const payload = jwt.verify(header.slice('Bearer '.length), process.env.JWT_SECRET ?? 'dev-secret-change-me');
    if (!isAuthenticatedUser(payload)) {
      next(new UnauthorizedError('Invalid token payload'));
      return;
    }
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
