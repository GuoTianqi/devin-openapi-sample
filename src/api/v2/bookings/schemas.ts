import { z } from 'zod';

export const bookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled']);

const timeRangeRefinement = <T extends { startTime?: string; endTime?: string }>(value: T, ctx: z.RefinementCtx) => {
  if (value.startTime && value.endTime && new Date(value.startTime) >= new Date(value.endTime)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endTime'],
      message: 'endTime must be after startTime',
    });
  }
};

export const createBookingSchema = z
  .object({
    title: z.string().min(1).max(200),
    notes: z.string().max(1000).optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    roomId: z.string().uuid(),
  })
  .superRefine(timeRangeRefinement);

export const updateBookingSchema = z
  .object({
    title: z.string().min(1).max(200),
    notes: z.string().max(1000),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    roomId: z.string().uuid(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' })
  .superRefine(timeRangeRefinement);

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  status: bookingStatusSchema.optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
