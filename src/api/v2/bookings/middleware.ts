import { RequestHandler } from 'express';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { BookingsService } from './service';

const ADMIN_ROLE = 'admin';

export const requireBookingOwnerOrAdmin =
  (service = new BookingsService()): RequestHandler =>
  async (req, _res, next) => {
    try {
      if (!req.user) throw new UnauthorizedError();

      const booking = await service.getById(req.params.id);
      if (booking.organizerId !== req.user.id && req.user.role !== ADMIN_ROLE) {
        throw new ForbiddenError();
      }
      next();
    } catch (error) {
      next(error);
    }
  };
