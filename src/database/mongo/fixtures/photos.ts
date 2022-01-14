import { ObjectId } from 'mongodb';
import { PhotoStatus } from '../../../models/Photo';

import { PhotoDocument } from '../models/Photo';
import { devices } from './devices';
import { users } from './users';

const [userOne, userTwo] = users;
const [userOneDeviceOne, , userTwoDeviceOne, userTwoDeviceTwo] = devices;

const userOnePhotos: Required<PhotoDocument>[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userOneDeviceOne._id,
    fileId: 'photoOneFileId',
    height: 10,
    name: 'photoOne',
    previewId: 'photoOnePreviewId',
    size: 10,
    type: 'jpg',
    userId: userOne._id,
    width: 10,
    status: PhotoStatus.Exists,
    takenAt: new Date('2021-11-16 18:32:45.110Z'),
    statusChangedAt: new Date('2021-11-16 18:32:45.110Z')
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userOneDeviceOne._id,
    fileId: 'photoTwoFileId',
    height: 10,
    name: 'photoTwo',
    previewId: 'photoTwoPreviewId',
    size: 10,
    type: 'jpg',
    userId: userOne._id,
    width: 10,
    status: PhotoStatus.Exists,
    takenAt: new Date('2021-11-16 18:32:45.110Z'),
    statusChangedAt: new Date('2021-11-16 18:32:45.110Z')
  },
];

const userTwoPhotos: Required<PhotoDocument>[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaac'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userTwoDeviceOne._id,
    fileId: 'photoThirdFileId',
    height: 10,
    name: 'photoThird',
    previewId: 'photoThirdPreviewId',
    size: 10,
    type: 'jpg',
    userId: userTwo._id,
    width: 10,
    status: PhotoStatus.Exists,
    takenAt: new Date('2021-11-16 18:32:45.110Z'),
    statusChangedAt: new Date('2021-11-16 18:32:45.110Z')
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaad'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    deviceId: userTwoDeviceTwo._id,
    fileId: 'photoFourthFileId',
    height: 10,
    name: 'photoFourth',
    previewId: 'photoFourthPreviewId',
    size: 10,
    type: 'jpg',
    userId: userTwo._id,
    width: 10,
    status: PhotoStatus.Exists,
    takenAt: new Date('2021-11-16 18:32:45.110Z'),
    statusChangedAt: new Date('2021-11-16 18:32:45.110Z')
  },
];

export const photos: Required<PhotoDocument>[] = [...userOnePhotos, ...userTwoPhotos];
