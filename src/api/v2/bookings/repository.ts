import { Booking, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class BookingsRepository {
  findMany(where: Prisma.BookingWhereInput, skip: number, take: number): Promise<Booking[]> {
    return prisma.booking.findMany({ where, skip, take, orderBy: { startTime: 'asc' } });
  }

  count(where: Prisma.BookingWhereInput): Promise<number> {
    return prisma.booking.count({ where });
  }

  findById(id: string): Promise<Booking | null> {
    return prisma.booking.findFirst({ where: { id, deletedAt: null } });
  }

  findOverlapping(roomId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<Booking | null> {
    return prisma.booking.findFirst({
      where: {
        roomId,
        deletedAt: null,
        status: { not: 'cancelled' },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  roomExists(roomId: string): Promise<boolean> {
    return prisma.room.count({ where: { id: roomId } }).then((count) => count > 0);
  }

  create(data: Prisma.BookingUncheckedCreateInput): Promise<Booking> {
    return prisma.booking.create({ data });
  }

  update(id: string, data: Prisma.BookingUncheckedUpdateInput): Promise<Booking> {
    return prisma.booking.update({ where: { id }, data });
  }
}
