import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';

const testDbPath = path.join(__dirname, '..', '..', 'prisma', 'test.db');

beforeAll(() => {
  if (existsSync(testDbPath)) rmSync(testDbPath);
  execSync('npx prisma db push --skip-generate --force-reset', {
    cwd: path.join(__dirname, '..', '..'),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'ignore',
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
