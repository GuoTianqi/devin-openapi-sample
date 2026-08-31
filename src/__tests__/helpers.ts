import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export const signToken = (user: { id: string; email: string; role: string }): string =>
  jwt.sign(user, process.env.JWT_SECRET ?? 'dev-secret-change-me', { expiresIn: '1h' });

export const authHeader = (user: { id: string; email: string; role: string }): string =>
  `Bearer ${signToken(user)}`;

export const createUser = (overrides: Partial<{ email: string; name: string; role: string }> = {}) =>
  prisma.user.create({
    data: {
      email: overrides.email ?? `user-${Math.random().toString(36).slice(2)}@example.com`,
      name: overrides.name ?? 'Test User',
      role: overrides.role ?? 'member',
    },
  });

export const createRoom = (name = 'Room A') => prisma.room.create({ data: { name } });
