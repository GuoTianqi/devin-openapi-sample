import { Booking } from '@prisma/client';
import { ConflictError, NotFoundError, UnprocessableEntityError } from '@/lib/errors';
import { BookingsRepository } from './repository';
import type { CancelBookingInput, CreateBookingInput, ListBookingsQuery, UpdateBookingInput } from './schemas';

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export class BookingsService {
  constructor(private readonly repository = new BookingsRepository()) {}

  async list(query: ListBookingsQuery): Promise<Paginated<Booking>> {
    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.startDate ? { endTime: { gte: new Date(`${query.startDate}T00:00:00.000Z`) } } : {}),
      ...(query.endDate ? { startTime: { lte: new Date(`${query.endDate}T23:59:59.999Z`) } } : {}),
    };

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

  async getById(id: string): Promise<Booking> {
    const booking = await this.repository.findById(id);
    if (!booking) throw new NotFoundError('Booking');
    return booking;
  }

  async create(input: CreateBookingInput, organizerId: string): Promise<Booking> {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    if (!(await this.repository.roomExists(input.roomId))) throw new NotFoundError('Room');
    await this.assertNoOverlap(input.roomId, startTime, endTime);

    return this.repository.create({
      title: input.title,
      notes: input.notes,
      startTime,
      endTime,
      roomId: input.roomId,
      organizerId,
    });
  }

  async update(id: string, input: UpdateBookingInput): Promise<Booking> {
    const booking = await this.getById(id);
    if (booking.status === 'cancelled') {
      throw new UnprocessableEntityError('Cancelled bookings cannot be modified');
    }

    const startTime = input.startTime ? new Date(input.startTime) : booking.startTime;
    const endTime = input.endTime ? new Date(input.endTime) : booking.endTime;
    const roomId = input.roomId ?? booking.roomId;

    if (startTime >= endTime) {
      throw new UnprocessableEntityError('endTime must be after startTime');
    }
    if (input.roomId && !(await this.repository.roomExists(input.roomId))) {
      throw new NotFoundError('Room');
    }
    if (input.startTime || input.endTime || input.roomId) {
      await this.assertNoOverlap(roomId, startTime, endTime, id);
    }

    return this.repository.update(id, {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.notes === undefined ? {} : { notes: input.notes }),
      startTime,
      endTime,
      roomId,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.update(id, { deletedAt: new Date() });
  }

  async confirm(id: string): Promise<Booking> {
    const booking = await this.getById(id);
    if (booking.status === 'cancelled') {
      throw new UnprocessableEntityError('Cancelled bookings cannot be confirmed');
    }
    if (booking.status === 'confirmed') return booking;

    return this.repository.update(id, { status: 'confirmed' });
  }

  async cancel(id: string, input: CancelBookingInput): Promise<Booking> {
    const booking = await this.getById(id);
    if (booking.status === 'cancelled') {
      throw new UnprocessableEntityError('Booking is already cancelled');
    }

    return this.repository.update(id, { status: 'cancelled', cancellationReason: input.reason ?? null });
  }

  private async assertNoOverlap(roomId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<void> {
    const conflict = await this.repository.findOverlapping(roomId, startTime, endTime, excludeId);
    if (conflict) {
      throw new ConflictError('Time slot conflicts with an existing booking', { conflictingBookingId: conflict.id });
    }
  }
}
