import { ObjectId } from 'mongodb';
import { PhotoPreviewType, PhotosItemType, PhotoStatus } from '../../../models/Photo';

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
    previews: [
      {
        width: 50,
        height: 50,
        fileId: 'photoOnePreviewFileId1',
        size: 100,
        type: PhotoPreviewType.PNG
      },
      {
        width: 50,
        height: 50,
        fileId: 'photoOnePreviewFileId2',
        size: 55,
        type: PhotoPreviewType.PNG
      }
    ],
    size: 10,
    type: 'jpg',
    userId: userOne._id,
    width: 10,
    status: PhotoStatus.Exists,
    hash: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    duration: 0,
    itemType: PhotosItemType.PHOTO,
    takenAt: new Date('2021-11-16 18:32:45.110Z'),
    statusChangedAt: new Date('2021-11-16 18:32:45.110Z'),
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
    previews: [{
      width: 50,
      height: 50,
      fileId: 'photoTwoPreviewFileId',
      size: 100,
      type: PhotoPreviewType.PNG
    }],
    size: 10,
    type: 'jpg',
    userId: userOne._id,
    width: 10,
    status: PhotoStatus.Exists,
    hash: 'aaaaaaaaaaaaaaaaaaaaaaab',
    duration: 0,
    itemType: PhotosItemType.PHOTO,
    takenAt: new Date('2021-11-16 18:32:45.110Z'),
    statusChangedAt: new Date('2021-11-16 18:32:45.110Z'),
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
    previews: [],
    size: 10,
    type: 'jpg',
    userId: userTwo._id,
    width: 10,
    status: PhotoStatus.Exists,
    hash: 'aaaaaaaaaaaaaaaaaaaaaaac',
    duration: 0,
    itemType: PhotosItemType.PHOTO,
    takenAt: new Date('2021-11-16 18:32:45.110Z'),
    statusChangedAt: new Date('2021-11-16 18:32:45.110Z'),
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
    previews: [],
    size: 10,
    type: 'jpg',
    userId: userTwo._id,
    width: 10,
    status: PhotoStatus.Exists,
    hash: 'aaaaaaaaaaaaaaaaaaaaaaad',
    duration: 0,
    itemType: PhotosItemType.PHOTO,
    takenAt: new Date('2021-11-16 18:32:45.110Z'),
    statusChangedAt: new Date('2021-11-16 18:32:45.110Z'),
  },
];

export const photos: Required<PhotoDocument>[] = [...userOnePhotos, ...userTwoPhotos];
