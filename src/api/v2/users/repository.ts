import { Prisma, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class UsersRepository {
  findMany(where: Prisma.UserWhereInput, skip: number, take: number): Promise<User[]> {
    return prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  count(where: Prisma.UserWhereInput): Promise<number> {
    return prisma.user.count({ where });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
