import { RequestHandler } from 'express';
import { UsersService } from './service';

export class UsersController {
  constructor(private readonly service = new UsersService()) {}

  list: RequestHandler = async (req, res, next) => {
    try {
      res.json(await this.service.list(req.query as never));
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      res.json(await this.service.getById(req.params.id));
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    try {
      res.status(201).json(await this.service.create(req.body));
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      res.json(await this.service.update(req.params.id, req.body));
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
}
