import { Router } from 'express';
import bookingsRouter from './bookings/router';
import usersRouter from './users/router';

const router = Router();

router.use('/bookings', bookingsRouter);
router.use('/users', usersRouter);

export default router;
