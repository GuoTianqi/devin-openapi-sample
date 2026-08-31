import request from 'supertest';
import { createApp } from '@/app';
import { prisma } from '@/lib/prisma';
import { authHeader, createUser } from './helpers';

const app = createApp();

describe('/api/v2/users', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('returns 401 without auth', async () => {
    await request(app).get('/api/v2/users').expect(401);
  });

  it('returns paginated users', async () => {
    const actor = await createUser({ role: 'admin' });
    await createUser();

    const response = await request(app)
      .get('/api/v2/users')
      .set('Authorization', authHeader(actor))
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination).toMatchObject({ page: 1, limit: 20, total: 2 });
  });

  it('creates a user and rejects invalid payloads', async () => {
    const actor = await createUser({ role: 'admin' });

    await request(app)
      .post('/api/v2/users')
      .set('Authorization', authHeader(actor))
      .send({ email: 'new@example.com', name: 'New User' })
      .expect(201);

    await request(app)
      .post('/api/v2/users')
      .set('Authorization', authHeader(actor))
      .send({ email: 'not-an-email', name: '' })
      .expect(400);
  });

  it('returns 404 for a missing user', async () => {
    const actor = await createUser({ role: 'admin' });

    await request(app)
      .get('/api/v2/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', authHeader(actor))
      .expect(404);
  });
});
