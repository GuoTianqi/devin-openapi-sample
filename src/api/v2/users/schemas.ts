import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.enum(['admin', 'organizer', 'member']).default('member'),
});

export const updateUserSchema = createUserSchema.partial();

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
