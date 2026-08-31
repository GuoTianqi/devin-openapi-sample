import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { BookingsController } from './controller';
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
router.patch('/:id', validate({ body: updateBookingSchema }), ctrl.update);
router.delete('/:id', ctrl.softDelete);
router.post('/:id/confirm', ctrl.confirm);
router.post('/:id/cancel', validate({ body: cancelBookingSchema }), ctrl.cancel);

export default router;
