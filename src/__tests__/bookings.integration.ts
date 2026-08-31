import request from 'supertest';
import { createApp } from '@/app';
import { prisma } from '@/lib/prisma';
import { authHeader, createRoom, createUser } from './helpers';

const app = createApp();

const iso = (day: number, hour: number) => new Date(Date.UTC(2030, 0, day, hour, 0, 0)).toISOString();

let organizer: { id: string; email: string; role: string };
let roomId: string;

const validPayload = () => ({
  title: 'Sprint planning',
  notes: 'Bring the roadmap',
  startTime: iso(10, 9),
  endTime: iso(10, 10),
  roomId,
});

const createBooking = async (overrides: Record<string, unknown> = {}) => {
  const response = await request(app)
    .post('/api/v2/bookings')
    .set('Authorization', authHeader(organizer))
    .send({ ...validPayload(), ...overrides })
    .expect(201);
  return response.body;
};

describe('/api/v2/bookings', () => {
  beforeEach(async () => {
    await prisma.booking.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();

    organizer = await createUser({ role: 'organizer' });
    roomId = (await createRoom()).id;
  });

  describe('GET /', () => {
    it('returns paginated bookings', async () => {
      await createBooking();
      await createBooking({ startTime: iso(11, 9), endTime: iso(11, 10) });

      const response = await request(app)
        .get('/api/v2/bookings')
        .query({ page: 1, limit: 1 })
        .set('Authorization', authHeader(organizer))
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    });

    it('filters by date range', async () => {
      await createBooking();
      const later = await createBooking({ startTime: iso(20, 9), endTime: iso(20, 10) });

      const response = await request(app)
        .get('/api/v2/bookings')
        .query({ startDate: '2030-01-15', endDate: '2030-01-25' })
        .set('Authorization', authHeader(organizer))
        .expect(200);

      expect(response.body.data.map((booking: { id: string }) => booking.id)).toEqual([later.id]);
    });

    it('returns 400 for an invalid query parameter', async () => {
      await request(app)
        .get('/api/v2/bookings')
        .query({ limit: 500 })
        .set('Authorization', authHeader(organizer))
        .expect(400);
    });

    it('returns 401 without auth', async () => {
      await request(app).get('/api/v2/bookings').expect(401);
    });
  });

  describe('POST /', () => {
    it('creates a booking with valid data', async () => {
      const response = await request(app)
        .post('/api/v2/bookings')
        .set('Authorization', authHeader(organizer))
        .send(validPayload())
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Sprint planning',
        roomId,
        organizerId: organizer.id,
        status: 'pending',
      });
    });

    it('returns only the fields defined by the spec', async () => {
      const booking = await createBooking();

      expect(Object.keys(booking).sort()).toEqual(
        [
          'cancellationReason',
          'createdAt',
          'endTime',
          'id',
          'notes',
          'organizerId',
          'roomId',
          'startTime',
          'status',
          'title',
          'updatedAt',
        ].sort(),
      );
    });

    it('returns 400 for missing required fields', async () => {
      await request(app)
        .post('/api/v2/bookings')
        .set('Authorization', authHeader(organizer))
        .send({ title: 'No times' })
        .expect(400);
    });

    it('returns 400 when endTime is not after startTime', async () => {
      await request(app)
        .post('/api/v2/bookings')
        .set('Authorization', authHeader(organizer))
        .send({ ...validPayload(), startTime: iso(10, 11), endTime: iso(10, 10) })
        .expect(400);
    });

    it('returns 404 for an unknown room', async () => {
      await request(app)
        .post('/api/v2/bookings')
        .set('Authorization', authHeader(organizer))
        .send({ ...validPayload(), roomId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });

    it('returns 409 for an overlapping time slot', async () => {
      await createBooking();

      const response = await request(app)
        .post('/api/v2/bookings')
        .set('Authorization', authHeader(organizer))
        .send({ ...validPayload(), startTime: iso(10, 9), endTime: iso(10, 11) })
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('allows a back-to-back booking in the same room', async () => {
      await createBooking();

      await request(app)
        .post('/api/v2/bookings')
        .set('Authorization', authHeader(organizer))
        .send({ ...validPayload(), startTime: iso(10, 10), endTime: iso(10, 11) })
        .expect(201);
    });
  });

  describe('GET /:id', () => {
    it('returns a booking', async () => {
      const booking = await createBooking();

      const response = await request(app)
        .get(`/api/v2/bookings/${booking.id}`)
        .set('Authorization', authHeader(organizer))
        .expect(200);

      expect(response.body.id).toBe(booking.id);
    });

    it('returns 404 for a non-existent booking', async () => {
      await request(app)
        .get('/api/v2/bookings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', authHeader(organizer))
        .expect(404);
    });
  });

  describe('PATCH /:id', () => {
    it('updates booking fields', async () => {
      const booking = await createBooking();

      const response = await request(app)
        .patch(`/api/v2/bookings/${booking.id}`)
        .set('Authorization', authHeader(organizer))
        .send({ title: 'Retro' })
        .expect(200);

      expect(response.body.title).toBe('Retro');
      expect(response.body.startTime).toBe(booking.startTime);
    });

    it('returns 400 for an empty payload', async () => {
      const booking = await createBooking();

      await request(app)
        .patch(`/api/v2/bookings/${booking.id}`)
        .set('Authorization', authHeader(organizer))
        .send({})
        .expect(400);
    });

    it('returns 409 when the new time overlaps another booking', async () => {
      const first = await createBooking();
      const second = await createBooking({ startTime: iso(10, 14), endTime: iso(10, 15) });

      await request(app)
        .patch(`/api/v2/bookings/${second.id}`)
        .set('Authorization', authHeader(organizer))
        .send({ startTime: first.startTime, endTime: first.endTime })
        .expect(409);
    });

    it('returns 422 for a cancelled booking', async () => {
      const booking = await createBooking();
      await request(app)
        .post(`/api/v2/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(organizer))
        .expect(200);

      await request(app)
        .patch(`/api/v2/bookings/${booking.id}`)
        .set('Authorization', authHeader(organizer))
        .send({ title: 'Too late' })
        .expect(422);
    });

    it('returns 404 for a non-existent booking', async () => {
      await request(app)
        .patch('/api/v2/bookings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', authHeader(organizer))
        .send({ title: 'Nope' })
        .expect(404);
    });
  });

  describe('DELETE /:id', () => {
    it('soft deletes a booking and frees the time slot', async () => {
      const booking = await createBooking();

      await request(app)
        .delete(`/api/v2/bookings/${booking.id}`)
        .set('Authorization', authHeader(organizer))
        .expect(204);

      await request(app)
        .get(`/api/v2/bookings/${booking.id}`)
        .set('Authorization', authHeader(organizer))
        .expect(404);

      expect(await prisma.booking.findUnique({ where: { id: booking.id } })).not.toBeNull();

      await request(app)
        .post('/api/v2/bookings')
        .set('Authorization', authHeader(organizer))
        .send(validPayload())
        .expect(201);
    });
  });

  describe('POST /:id/confirm', () => {
    it('transitions status to confirmed', async () => {
      const booking = await createBooking();

      const response = await request(app)
        .post(`/api/v2/bookings/${booking.id}/confirm`)
        .set('Authorization', authHeader(organizer))
        .expect(200);

      expect(response.body.status).toBe('confirmed');
    });

    it('returns 422 for an already-cancelled booking', async () => {
      const booking = await createBooking();
      await request(app)
        .post(`/api/v2/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(organizer))
        .expect(200);

      await request(app)
        .post(`/api/v2/bookings/${booking.id}/confirm`)
        .set('Authorization', authHeader(organizer))
        .expect(422);
    });
  });

  describe('POST /:id/cancel', () => {
    it('cancels a booking with a reason', async () => {
      const booking = await createBooking();

      const response = await request(app)
        .post(`/api/v2/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(organizer))
        .send({ reason: 'Room flooded' })
        .expect(200);

      expect(response.body).toMatchObject({ status: 'cancelled', cancellationReason: 'Room flooded' });
    });

    it('returns 422 when cancelling twice', async () => {
      const booking = await createBooking();

      await request(app)
        .post(`/api/v2/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(organizer))
        .expect(200);

      await request(app)
        .post(`/api/v2/bookings/${booking.id}/cancel`)
        .set('Authorization', authHeader(organizer))
        .expect(422);
    });

    it('returns 401 without auth', async () => {
      const booking = await createBooking();

      await request(app).post(`/api/v2/bookings/${booking.id}/cancel`).expect(401);
    });
  });
});
