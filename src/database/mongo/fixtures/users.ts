import { ObjectId } from 'mongodb';
import { v4 } from 'uuid';

import { UserDocument } from '../models/User';

const userOne: Required<UserDocument> = {
  _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
  uuid: v4(),
  createdAt: new Date('2021-11-16 18:32:45.110Z'),
  updatedAt: new Date('2021-11-16 18:32:45.110Z'),
  bucketId: '---',
};

const userTwo: Required<UserDocument> = {
  _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
  uuid: v4(),
  createdAt: new Date('2021-11-16 18:32:45.110Z'),
  updatedAt: new Date('2021-11-16 18:32:45.110Z'),
  bucketId: '---'
};

export const users: Required<UserDocument>[] = [userOne, userTwo];
