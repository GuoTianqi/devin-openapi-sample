import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '@/lib/errors';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (req, _res, next) => {
    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        next(
          new BadRequestError(
            `Invalid request ${key}`,
            result.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          ),
        );
        return;
      }

      Object.defineProperty(req, key, { value: result.data, writable: true, configurable: true });
    }

    next();
  };
