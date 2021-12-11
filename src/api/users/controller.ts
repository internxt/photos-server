import { FastifyRequest, FastifyReply } from 'fastify';

import { UsersUsecase } from './usecase';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { Device } from '../../models/Device';
import { InitUserType } from './schemas';
import { UserId } from '../../models/User';
import { NotFoundError } from '../errors/http/NotFound';

export class UsersController {
  private usecase: UsersUsecase;

  constructor(usecase: UsersUsecase) {
    this.usecase = usecase;
  }

  async getUserById(req: FastifyRequest<{ Params: { id: UserId } }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const requestedUserId = req.params.id;

    if (user.payload.uuid !== requestedUserId) {
      return rep.status(403).send({ message: 'Forbidden' });
    }

    const requestedUser = await this.usecase.obtainUserById(requestedUserId);

    if (!requestedUser) {
      throw new NotFoundError({ resource: 'User' });
    }

    rep.send(requestedUser);
  }

  async postUser(req: FastifyRequest<{ Body: InitUserType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const deviceInfo: Omit<Device, 'id' | 'userId'> = req.body;

    const createdUserId = await this.usecase.initUser(user.payload.uuid, deviceInfo);

    rep.code(201).send({ id: createdUserId });
  }

  async deleteUserById(req: FastifyRequest<{ Params: { id: UserId }}>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const userToDeleteId = req.params.id;

    if (user.payload.uuid !== userToDeleteId) {
      return rep.send(403).send({ message: 'Forbidden' });
    }

    await this.usecase.removeUser(user.payload.uuid);

    return rep.send({ message: 'Deleted' });
  }
}
