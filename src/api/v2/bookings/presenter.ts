import { Booking } from '@prisma/client';

export interface BookingResponse {
  id: string;
  title: string;
  notes: string | null;
  startTime: string;
  endTime: string;
  roomId: string;
  organizerId: string;
  status: string;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export const toBookingResponse = (booking: Booking): BookingResponse => ({
  id: booking.id,
  title: booking.title,
  notes: booking.notes,
  startTime: booking.startTime.toISOString(),
  endTime: booking.endTime.toISOString(),
  roomId: booking.roomId,
  organizerId: booking.organizerId,
  status: booking.status,
  cancellationReason: booking.cancellationReason,
  createdAt: booking.createdAt.toISOString(),
  updatedAt: booking.updatedAt.toISOString(),
});
