import { z } from 'zod';
import { User } from '@prisma/client';
import { NotFoundError } from '@/lib/errors';
import { UsersRepository } from './repository';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from './schemas';

type ListQuery = z.infer<typeof listUsersQuerySchema>;
type CreateInput = z.infer<typeof createUserSchema>;
type UpdateInput = z.infer<typeof updateUserSchema>;

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export class UsersService {
  constructor(private readonly repository = new UsersRepository()) {}

  async list(query: ListQuery): Promise<Paginated<User>> {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.repository.findMany(where, (query.page - 1) * query.limit, query.limit),
      this.repository.count(where),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  create(input: CreateInput): Promise<User> {
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateInput): Promise<User> {
    await this.getById(id);
    return this.repository.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.softDelete(id);
  }
}
