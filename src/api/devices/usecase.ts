import { Device, DeviceId } from '../../models/Device';

import devicesRepository from './repository';

export function obtainDevice(deviceId: DeviceId): Promise<Device | null> {
  return devicesRepository.getById(deviceId);
}

export function saveDevice(device: Omit<Device, 'id'>): Promise<DeviceId> {
  return devicesRepository.create(device);
}

export function removeDevice(deviceId: string): Promise<void> {
  return devicesRepository.deleteById(deviceId);
}
