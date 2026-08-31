process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'file:./test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
