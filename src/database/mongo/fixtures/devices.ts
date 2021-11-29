import { ObjectId } from 'mongodb';

import { DeviceDocument } from '../models/Device';
import { users } from '../users';

const userOneDevices = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    mac: 'macOneUserOne' + users.one,
    name: 'deviceNameOne' + users.one,
    userUuid: users.one,
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaab'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    mac: 'macTwoUserOne' + users.one,
    name: 'deviceNameTwo' + users.one,
    userUuid: users.one,
  },
];

const userTwoDevices = [
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaac'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    mac: 'macOneUserTwo' + users.two,
    name: 'deviceNameOne' + users.two,
    userUuid: users.two,
  },
  {
    _id: new ObjectId('aaaaaaaaaaaaaaaaaaaaaaad'),
    createdAt: new Date('2021-11-16 18:32:45.110Z'),
    updatedAt: new Date('2021-11-16 18:32:45.110Z'),
    mac: 'macTwoUserTwo' + users.two,
    name: 'deviceNameTwo' + users.two,
    userUuid: users.two,
  },
];

const devices: Required<DeviceDocument>[] = [...userOneDevices, ...userTwoDevices];

export default devices;
