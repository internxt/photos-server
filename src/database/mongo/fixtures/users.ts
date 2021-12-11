import { ObjectId } from 'mongodb';

import { UserDocument } from '../models/User';

const userOne: Required<UserDocument> = {
  _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
  createdAt: new Date('2021-11-16 18:32:45.110Z'),
  updatedAt: new Date('2021-11-16 18:32:45.110Z'),
  bucketId: '---',
};

const userTwo: Required<UserDocument> = {
  _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
  createdAt: new Date('2021-11-16 18:32:45.110Z'),
  updatedAt: new Date('2021-11-16 18:32:45.110Z'),
  bucketId: '---'
};

const users: Required<UserDocument>[] = [userOne, userTwo];

module.exports = users;
