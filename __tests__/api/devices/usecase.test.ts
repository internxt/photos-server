import { Collection } from 'mongodb';
import { stub } from 'sinon';

import { DevicesRepository } from '../../../src/api/devices/repository';
import { DevicesUsecase } from '../../../src/api/devices/usecase';
import { Device } from '../../../src/models/Device';

const CollectionStubbed = stub(Collection, 'prototype').returns(Collection);
let repository: DevicesRepository;
let usecase: DevicesUsecase;

beforeEach(() => {
  repository = new DevicesRepository(CollectionStubbed());
  usecase = new DevicesUsecase(repository);
});

describe('Devices usecases', () => {
  it('obtainDevice()', async () => {
    const deviceId = 'deviceId';
    const deviceDoc: Device = {
      id: deviceId,
      mac: '',
      name: '',
      userId: ''
    };

    stub(repository, 'getById').returns(Promise.resolve(deviceDoc));

    const device = await usecase.obtainDevice(deviceId);

    expect(device).toStrictEqual(deviceDoc);
  });

  it('saveDevice()', async () => {
    const expected = 'deviceId';
    const deviceDoc: Device = {
      id: expected,
      mac: '',
      name: '',
      userId: ''
    };

    stub(repository, 'create').returns(Promise.resolve(expected));

    const received = await usecase.saveDevice(deviceDoc);

    expect(received).toStrictEqual(expected);
  });

  it('removeDevice()', async () => {
    const deviceId = 'deviceId';
    const deviceDoc: Device = {
      id: '',
      mac: '',
      name: '',
      userId: ''
    };

    stub(repository, 'getById').returns(Promise.resolve(deviceDoc));

    const device = await usecase.obtainDevice(deviceId);

    expect(device).toStrictEqual(deviceDoc);
  });
});
