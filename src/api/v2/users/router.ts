import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { UsersController } from './controller';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from './schemas';

const router = Router();
const ctrl = new UsersController();

router.use(authenticate);

router.get('/', validate({ query: listUsersQuerySchema }), ctrl.list);
router.post('/', validate({ body: createUserSchema }), ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', validate({ body: updateUserSchema }), ctrl.update);
router.delete('/:id', ctrl.softDelete);

export default router;
