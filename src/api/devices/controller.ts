import { FastifyRequest, FastifyReply } from 'fastify';

import { Device, DeviceId } from '../../models/Device';
import { obtainDevice, obtainUserDevices, removeDevice, saveDevice } from './usecase';
import { NotFoundError } from '../errors/NotFoundError';

export async function getDeviceById(req: FastifyRequest<{ Params: { id: DeviceId } }>, rep: FastifyReply) {  
  const device = await obtainDevice(req.params.id);

  if (!device) {
    throw new NotFoundError('Device');
  }

  rep.send(device);
}

export async function getDeviceByUserId(req: FastifyRequest<{ Params: { userId: string } }>, rep: FastifyReply) {
  const devices = await obtainUserDevices(req.params.userId);

  if (!devices || devices.length === 0) {
    throw new NotFoundError('Devices');
  }
  
  rep.send(devices);
}

type PostDeviceBody = { 
  Body: { 
    device: Device,
  } 
};

export async function postDevice(req: FastifyRequest<PostDeviceBody>, rep: FastifyReply) {
  const createdDevice = await saveDevice(req.body.device);

  rep.code(201).send(createdDevice);
}

export async function deleteDeviceById(req: FastifyRequest<{ Params: { id: DeviceId } }>, rep: FastifyReply) {
  await removeDevice(req.params.id);

  rep.send({ message: 'Deleted' });
}
