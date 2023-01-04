import { ObjectId } from 'mongodb';

import { UserDocument } from '../models/User';

const userOne: Required<UserDocument> = {
  _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
  uuid: 'aa9696ee-4bf3-4aa0-b38e-f5fdc540a4a0',
  createdAt: new Date('2021-11-16 18:32:45.110Z'),
  updatedAt: new Date('2021-11-16 18:32:45.110Z'),
  bucketId: '---',
  galleryUsage: 0,
  trashUsage: 0,
};

const userTwo: Required<UserDocument> = {
  _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
  uuid: '2148255a-289e-425b-a29d-6e4b0c2dc2bb',
  createdAt: new Date('2021-11-16 18:32:45.110Z'),
  updatedAt: new Date('2021-11-16 18:32:45.110Z'),
  bucketId: '---',
  galleryUsage: 0,
  trashUsage: 0,
};

export const users: Required<UserDocument>[] = [userOne, userTwo];
