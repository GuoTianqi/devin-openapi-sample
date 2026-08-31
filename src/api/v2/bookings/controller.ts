import { RequestHandler } from 'express';
import { UnauthorizedError } from '@/lib/errors';
import { toBookingResponse } from './presenter';
import { BookingsService } from './service';
import type { CancelBookingInput, CreateBookingInput, ListBookingsQuery, UpdateBookingInput } from './schemas';

export class BookingsController {
  constructor(private readonly service = new BookingsService()) {}

  list: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.service.list(req.query as unknown as ListBookingsQuery);
      res.json({ data: result.data.map(toBookingResponse), pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const booking = await this.service.create(req.body as CreateBookingInput, req.user.id);
      res.status(201).json(toBookingResponse(booking));
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      res.json(toBookingResponse(await this.service.getById(req.params.id)));
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      const booking = await this.service.update(req.params.id, req.body as UpdateBookingInput);
      res.json(toBookingResponse(booking));
    } catch (error) {
      next(error);
    }
  };

  softDelete: RequestHandler = async (req, res, next) => {
    try {
      await this.service.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  confirm: RequestHandler = async (req, res, next) => {
    try {
      res.json(toBookingResponse(await this.service.confirm(req.params.id)));
    } catch (error) {
      next(error);
    }
  };

  cancel: RequestHandler = async (req, res, next) => {
    try {
      const booking = await this.service.cancel(req.params.id, (req.body ?? {}) as CancelBookingInput);
      res.json(toBookingResponse(booking));
    } catch (error) {
      next(error);
    }
  };
}
