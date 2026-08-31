import express, { Express } from 'express';
import v2Router from '@/api/v2';
import { errorHandler } from '@/middleware/error-handler';
import { notFoundHandler } from '@/middleware/not-found';

export const createApp = (): Express => {
  const app = express();

  app.use(express.json());
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/v2', v2Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
