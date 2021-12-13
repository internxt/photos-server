import { ObjectId } from 'mongodb';

import { DeviceDocument } from '../models/Device';
import { UserDocument } from '../models/User';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const users: UserDocument[] = require('./users');
const [userOne, userTwo] = users;

const userOneDevices: DeviceDocument[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    mac: 'macOneUserOne' + userOne._id,
    name: 'deviceNameOne' + userOne._id,
    userId: userOne._id,
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    mac: 'macTwoUserOne' + userOne._id,
    name: 'deviceNameTwo' + userOne._id,
    userId: userOne._id,
  },
];

const userTwoDevices: DeviceDocument[] = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaac'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    mac: 'macOneUserTwo' + userTwo._id,
    name: 'deviceNameOne' + userTwo._id,
    userId: userTwo._id,
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaad'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    mac: 'macTwoUserTwo' + userTwo._id,
    name: 'deviceNameTwo' + userTwo._id,
    userId: userTwo._id,
  },
];

const devices: Required<DeviceDocument>[] = [...userOneDevices, ...userTwoDevices];

module.exports = devices;
