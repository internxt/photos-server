import { Device, DeviceId } from "../../models/Device";

import { create, getById, getByUserId, deleteById, deleteOne } from "./repository";

export function obtainUserDevices(userId: string): Promise<Device[] | null> {
  return getByUserId(userId);
}

export function obtainDevice(deviceId: DeviceId): Promise<Device | null> {
  return getById(deviceId);
}

export function saveDevice(device: Device): Promise<unknown> {
  return create(device);
}

type RemoveDeviceRef = DeviceId | Device;
export function removeDevice(deleteRef: RemoveDeviceRef): Promise<any> {
  if (typeof deleteRef === 'string') {
    return deleteById(deleteRef);
  }
  return deleteOne(deleteRef);
}

