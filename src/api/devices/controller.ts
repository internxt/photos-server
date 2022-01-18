import { FastifyRequest, FastifyReply } from 'fastify';

import { Device, DeviceId } from '../../models/Device';
import { DevicesUsecase } from './usecase';
import { CreateDeviceType } from './schemas';
import { NotFoundError } from '../errors/http/NotFound';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { UsersUsecase } from '../users/usecase';

export class DevicesController {
  private devicesUsecase: DevicesUsecase;
  private usersUsecase: UsersUsecase;

  constructor(devicesUsecase: DevicesUsecase, usersUsecase: UsersUsecase) {
    this.devicesUsecase = devicesUsecase;
    this.usersUsecase = usersUsecase;
  }

  async getDeviceById(req: FastifyRequest<{ Params: { id: DeviceId } }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const device = await this.devicesUsecase.obtainDevice(req.params.id);

    if (!device) {
      throw new NotFoundError({ resource: 'Device' });
    }

    if (device.userId !== user.payload.uuid) {
      return rep.status(403).send({ message: 'Forbidden' });
    }

    rep.send(device);
  }

  async postDevice(req: FastifyRequest<{ Body: CreateDeviceType }>, rep: FastifyReply) {
    const { payload: { uuid }} = req.user as AuthorizedUser;
    const device: CreateDeviceType = req.body;

    const user = await this.usersUsecase.obtainUserByUuid(uuid);

    if (!user) {
      return rep.code(400).send();
    }

    if (device.userId !== user.id) {
      return rep.code(403).send({ message: 'Forbidden' });
    }

    const createdDevice = await this.devicesUsecase.saveDevice(device);

    rep.code(201).send(createdDevice);
  }

  async deleteDeviceById(req: FastifyRequest<{ Params: { id: DeviceId } }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const device = await this.devicesUsecase.obtainDevice(req.params.id);

    if (!device) {
      throw new NotFoundError({ resource: 'Device' });
    }

    if (device.userId !== user.payload.uuid) {
      return rep.status(403).send({ message: 'Forbidden' });
    }

    await this.devicesUsecase.removeDevice(req.params.id);

    rep.send({ message: 'Deleted' });
  }
}
