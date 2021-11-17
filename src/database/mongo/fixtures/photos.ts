import { ObjectId } from 'mongodb';

import { PhotoDocument } from '../models/Photo';
import { users } from '../users';
import { DeviceDocument } from '../models/Device';

const devices: Required<DeviceDocument>[] = require('./devices');

const [
  userOneDeviceOne, 
  _, 
  userTwoDeviceOne,
  userTwoDeviceTwo
] = devices;

const userOnePhotos: Required<PhotoDocument>[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userOneDeviceOne._id.toString(),
    fileId: 'photoOneFileId',
    heigth: 10,
    name: 'photoOne',
    previewId: 'photoOnePreviewId',
    size: 10,
    type: 'jpg',
    userUuid: users.one,
    width: 10
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userOneDeviceOne._id.toString(),
    fileId: 'photoTwoFileId',
    heigth: 10,
    name: 'photoTwo',
    previewId: 'photoTwoPreviewId',
    size: 10,
    type: 'jpg',
    userUuid: users.one,
    width: 10
  }
];

const userTwoPhotos: Required<PhotoDocument>[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaac'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userTwoDeviceOne._id.toString(),
    fileId: 'photoThirdFileId',
    heigth: 10,
    name: 'photoThird',
    previewId: 'photoThirdPreviewId',
    size: 10,
    type: 'jpg',
    userUuid: users.one,
    width: 10
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaad'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userTwoDeviceTwo._id.toString(),
    fileId: 'photoFourthFileId',
    heigth: 10,
    name: 'photoFourth',
    previewId: 'photoFourthPreviewId',
    size: 10,
    type: 'jpg',
    userUuid: users.one,
    width: 10
  }
];

const photos: Required<PhotoDocument>[] = [ ...userOnePhotos, ...userTwoPhotos ];

module.exports = photos;
