import { Collection } from 'mongodb';
import { stub } from 'sinon';

import { DevicesRepository } from '../../../src/api/devices/repository';
import { DevicesUsecase } from '../../../src/api/devices/usecase';
import { UsersRepository } from '../../../src/api/users/repository';
import { Device } from '../../../src/models/Device';

const DevicesCollectionStubbed = stub(Collection, 'prototype').returns(Collection);
const UsersCollectionStubbed = stub(Collection, 'prototype').returns(Collection);

let devicesRepository: DevicesRepository;
let usersRepository: UsersRepository;
let usecase: DevicesUsecase;

beforeEach(() => {
  devicesRepository = new DevicesRepository(DevicesCollectionStubbed());
  usersRepository = new UsersRepository(UsersCollectionStubbed());
  usecase = new DevicesUsecase(devicesRepository, usersRepository);
});

describe('Devices usecases', () => {
  it('getDeviceById()', async () => {
    const deviceId = 'deviceId';
    const deviceDoc: Device = {
      id: deviceId,
      mac: '',
      name: '',
      userId: '',
      newestDate: new Date('January 1, 1971 00:00:01'),
      oldestDate: new Date()
    };

    stub(devicesRepository, 'getById').returns(Promise.resolve(deviceDoc));

    const device = await usecase.getDeviceById(deviceId);

    expect(device).toStrictEqual(deviceDoc);
  });

  it('saveDevice()', async () => {
    const deviceDoc: Device = {
      id: 'deviceId',
      mac: '',
      name: '',
      userId: '',
      newestDate: new Date('January 1, 1971 00:00:01'),
      oldestDate: new Date()
    };

    stub(devicesRepository, 'getByMac').returns(Promise.resolve(null));
    stub(devicesRepository, 'create').returns(Promise.resolve(deviceDoc));

    const received = await usecase.saveDevice(deviceDoc);
    const expected = deviceDoc;

    expect(received).toStrictEqual(expected);
  });

  it('removeDevice()', async () => {
    const deviceId = 'deviceId';
    const deviceDoc: Device = {
      id: '',
      mac: '',
      name: '',
      userId: '',
      newestDate: new Date('January 1, 1971 00:00:01'),
      oldestDate: new Date()
    };

    stub(devicesRepository, 'getById').returns(Promise.resolve(deviceDoc));

    const device = await usecase.getDeviceById(deviceId);

    expect(device).toStrictEqual(deviceDoc);
  });
});
