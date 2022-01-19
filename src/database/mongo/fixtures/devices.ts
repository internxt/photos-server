import { ObjectId } from 'mongodb';

import { DeviceDocument } from '../models/Device';
import { users } from './users';

const [userOne, userTwo] = users;

const userOneDevices: DeviceDocument[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    userId: userOne._id,
    mac: 'macOneUserOne' + userOne._id,
    name: 'deviceNameOne' + userOne._id,
    newestDate: new Date('January 1, 1971 00:00:01'),
    oldestDate: new Date(),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
    userId: userOne._id,
    mac: 'macTwoUserOne' + userOne._id,
    name: 'deviceNameTwo' + userOne._id,
    newestDate: new Date('January 1, 1971 00:00:01'),
    oldestDate: new Date(),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
  },
];

const userTwoDevices: DeviceDocument[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaac'),
    userId: userTwo._id,
    mac: 'macOneUserTwo' + userTwo._id,
    name: 'deviceNameOne' + userTwo._id,
    newestDate: new Date('January 1, 1971 00:00:01'),
    oldestDate: new Date(),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaad'),
    userId: userTwo._id,
    mac: 'macTwoUserTwo' + userTwo._id,
    name: 'deviceNameTwo' + userTwo._id,
    newestDate: new Date('January 1, 1971 00:00:01'),
    oldestDate: new Date(),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z')
  },
];

export const devices: Required<DeviceDocument>[] = [...userOneDevices, ...userTwoDevices];
