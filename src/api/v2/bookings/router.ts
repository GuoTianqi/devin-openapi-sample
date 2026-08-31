import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { BookingsController } from './controller';
import { requireBookingOwnerOrAdmin } from './middleware';
import {
  cancelBookingSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  updateBookingSchema,
} from './schemas';

const router = Router();
const ctrl = new BookingsController();

router.use(authenticate);

router.get('/', validate({ query: listBookingsQuerySchema }), ctrl.list);
router.post('/', validate({ body: createBookingSchema }), ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', requireBookingOwnerOrAdmin(), validate({ body: updateBookingSchema }), ctrl.update);
router.delete('/:id', requireBookingOwnerOrAdmin(), ctrl.softDelete);
router.post('/:id/confirm', authorize('organizer', 'admin'), ctrl.confirm);
router.post('/:id/cancel', authorize('organizer', 'admin'), validate({ body: cancelBookingSchema }), ctrl.cancel);

export default router;
