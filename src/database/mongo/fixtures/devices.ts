import { randomBytes } from 'crypto';
import { ObjectId } from 'mongodb';

import { DeviceDocument } from '../models/Device';
import { users } from '../users';

function generateDevice(name: string, mac: string, userUuid: string): Required<Omit<DeviceDocument, 'id'>> {
  return {
    _id: new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    name,
    mac,
    userUuid
  };
}

function generateDevices(devicesQty: number) {
  return {
    forUser: (uuid: string) => {
      return new Array(devicesQty).fill(0).map(() => {
        return generateDevice(
          randomBytes(6).toString('hex') + uuid, 
          randomBytes(6).toString('hex') + uuid,
          uuid
        );
      });
    }
  };
}


const devices: Required<Omit<DeviceDocument, 'id'>>[] = [
  ...generateDevices(2).forUser(users.one),
  ...generateDevices(4).forUser(users.two)
];

module.exports = devices;
