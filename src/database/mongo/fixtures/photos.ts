import { ObjectId } from 'mongodb';
import { DeviceDocument } from '../models/Device';

import { PhotoDocument } from '../models/Photo';
import { UserDocument } from '../models/User';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const users: UserDocument[] = require('./users');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const devices: DeviceDocument[] = require('./devices');

const [userOne, userTwo] = users;
const [userOneDeviceOne, , userTwoDeviceOne, userTwoDeviceTwo] = devices;

const userOnePhotos: Required<PhotoDocument>[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userOneDeviceOne._id,
    fileId: 'photoOneFileId',
    heigth: 10,
    name: 'photoOne',
    previewId: 'photoOnePreviewId',
    size: 10,
    type: 'jpg',
    userId: userOne._id,
    width: 10,
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userOneDeviceOne._id,
    fileId: 'photoTwoFileId',
    heigth: 10,
    name: 'photoTwo',
    previewId: 'photoTwoPreviewId',
    size: 10,
    type: 'jpg',
    userId: userOne._id,
    width: 10,
  },
];

const userTwoPhotos: Required<PhotoDocument>[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaac'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userTwoDeviceOne._id,
    fileId: 'photoThirdFileId',
    heigth: 10,
    name: 'photoThird',
    previewId: 'photoThirdPreviewId',
    size: 10,
    type: 'jpg',
    userId: userTwo._id,
    width: 10,
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaad'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userTwoDeviceTwo._id,
    fileId: 'photoFourthFileId',
    heigth: 10,
    name: 'photoFourth',
    previewId: 'photoFourthPreviewId',
    size: 10,
    type: 'jpg',
    userId: userTwo._id,
    width: 10,
  },
];

const photos: Required<PhotoDocument>[] = [...userOnePhotos, ...userTwoPhotos];

module.exports = photos;
