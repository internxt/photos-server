import { ObjectId } from 'mongodb';
import { randomBytes } from 'crypto';

import { PhotoDocument } from '../models/Photo';
import { DeviceId } from '../../../models/Device';

import { users } from '../users';
import { DeviceDocument } from '../models/Device';

const devices: Required<Omit<DeviceDocument, 'id'>>[] = require('./devices');

function generatePhoto(
  deviceId: string,
  fileId: string,
  heigth: number,
  width: number,
  name: string,
  previewId: string,
  size: number,
  type: string,
  userUuid: string
): Omit<PhotoDocument, 'id'> {
  return {
    _id: new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deviceId,
    fileId,
    heigth,
    width,
    name,
    previewId,
    size,
    type,
    userUuid
  };
}

function generatePhotos(devicesQty: number) {
  return {
    forUser: (uuid: string) => {
      return {
        onDevice: (deviceId: DeviceId) => {
          return new Array(devicesQty).fill(0).map(() => {
            return generatePhoto(
              deviceId,
              randomBytes(6).toString('hex') + uuid,
              10,
              10,
              randomBytes(6).toString('hex') + uuid,
              randomBytes(6).toString('hex') + uuid,
              10,
              'jpg',
              uuid
            );
          });
        }
      };
    }
  };
}

const userOneDevices = devices.slice(0, devices.reduce(
  (a: number, d) => {
    return d.userUuid === users.one ? a + 1 : a;
  }, 0)
);
const userTwoDevices = devices.slice(userOneDevices.length);

const photos: Omit<PhotoDocument, 'id'>[] = [
  ...generatePhotos(2).forUser(users.one).onDevice(userOneDevices[0]._id.toString()),
  ...generatePhotos(4).forUser(users.two).onDevice(userTwoDevices[0]._id.toString())
];

module.exports = photos;
