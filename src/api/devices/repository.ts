import { collections } from '../../database';
import { Device, DeviceId } from '../../models/Device';

export const getById = (id: DeviceId) => collections.devices?.findOne<Device>({ id });
export const getByUserId = (id: string) => collections.devices?.find<Device>({ userId: id });
export const create = (device: Device) => collections.devices?.insertOne(device);
export const deleteById = (id: DeviceId) => collections.devices?.deleteOne({ id });
export const deleteOne = (device: Device) => deleteById(device.id);
