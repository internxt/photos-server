import { FastifyRequest, FastifyReply } from 'fastify';

import { Device, DeviceId } from '../../models/Device';
import { DevicesUsecase } from './usecase';
import { CreateDeviceType } from './schemas';
import { NotFoundError } from '../errors/http/NotFound';
import { AuthorizedUser } from '../../middleware/auth/jwt';

export class DevicesController {
  private usecase: DevicesUsecase;

  constructor(usecase: DevicesUsecase) {
    this.usecase = usecase;
  }

  async getDeviceById(req: FastifyRequest<{ Params: { id: DeviceId } }>, rep: FastifyReply) {  
    const user = req.user as AuthorizedUser;
    const device = await this.usecase.obtainDevice(req.params.id);
  
    if (!device) {
      throw new NotFoundError({ resource: 'Device' });
    }
  
    if (device.userUuid !== user.payload.uuid) {
      return rep.status(403).send({ message: 'Forbidden' });
    }
  
    rep.send(device);
  }

  async postDevice(req: FastifyRequest<{ Body: CreateDeviceType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const device: Omit<Device, 'id'> = req.body;
  
    if (device.userUuid !== user.payload.uuid) {
      return rep.code(403).send({ message: 'Forbidden' });
    }
    
    const createdDeviceId = await this.usecase.saveDevice(device);
  
    rep.code(201).send({ id: createdDeviceId });
  }

  async deleteDeviceById(req: FastifyRequest<{ Params: { id: DeviceId } }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const device = await this.usecase.obtainDevice(req.params.id);

    if (!device) {
      throw new NotFoundError({ resource: 'Device' });
    }

    if (device.userUuid !== user.payload.uuid) {
      return rep.status(403).send({ message: 'Forbidden' });
    }

    await this.usecase.removeDevice(req.params.id);
  
    rep.send({ message: 'Deleted' });
  }
}
