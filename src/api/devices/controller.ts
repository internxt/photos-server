import { FastifyRequest, FastifyReply } from 'fastify';

import { DeviceId } from '../../models/Device';
import { obtainDevice, removeDevice, saveDevice } from './usecase';
import { CreateDeviceType } from './schemas';
import { NotFoundError } from '../errors/http/NotFound';

export async function getDeviceById(req: FastifyRequest<{ Params: { id: DeviceId } }>, rep: FastifyReply) {  
  const device = await obtainDevice(req.params.id);

  if (!device) {
    throw new NotFoundError({ resource: 'Device' });
  }

  rep.send(device);
}

export async function postDevice(req: FastifyRequest<{ Body: CreateDeviceType }>, rep: FastifyReply) {
  const createdDeviceId = await saveDevice(req.body);

  rep.code(201).send({ id: createdDeviceId });
}

export async function deleteDeviceById(req: FastifyRequest<{ Params: { id: DeviceId } }>, rep: FastifyReply) {
  await removeDevice(req.params.id);

  rep.send({ message: 'Deleted' });
}
