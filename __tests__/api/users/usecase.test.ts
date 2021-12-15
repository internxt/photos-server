import { Environment } from '@internxt/inxt-js';
import { Collection } from 'mongodb';
import { stub } from 'sinon';
import { v4 } from 'uuid';

import { DevicesRepository } from '../../../src/api/devices/repository';
import { UsersRepository } from '../../../src/api/users/repository';
import { UsersUsecase } from '../../../src/api/users/usecase';
import { User } from '../../../src/models/User';

const UsersCollectionStubbed = stub(Collection, 'prototype').returns(Collection);
const DevicesCollectionStubbed = stub(Collection, 'prototype').returns(Collection);

let usersRepository: UsersRepository;
let devicesRepository: DevicesRepository;
let usecase: UsersUsecase;
let network: Environment;

beforeEach(() => {
  usersRepository = new UsersRepository(UsersCollectionStubbed());
  devicesRepository = new DevicesRepository(DevicesCollectionStubbed());
  usecase = new UsersUsecase(usersRepository, devicesRepository);
  network = new Environment({
    bridgePass: 'test',
    bridgeUser: 'test',
    bridgeUrl: 'test.com'
  });
});

const bucketId = 'bucket-id';
const userId = 'user-id';
const deviceId = 'device-id'; 

describe('Users usecases', () => {
  it('obtainUserById()', async () => {
    const expected: User = {
      id: userId,
      bucketId: bucketId,
      uuid: v4()
    };

    stub(usersRepository, 'getById').returns(Promise.resolve(expected));

    const received = await usecase.obtainUserById(userId);

    expect(received).toStrictEqual(expected);
  });

  it('obtainUserByUuid()', async () => {
    const expected: User = {
      id: userId,
      bucketId: bucketId,
      uuid: v4()
    };

    stub(usersRepository, 'getByUuid').returns(Promise.resolve(expected));

    const received = await usecase.obtainUserByUuid(expected.uuid);

    expect(received).toStrictEqual(expected);
  });

  it('isUserAlreadyInitialized()', async () => {  
    stub(usersRepository, 'getByUuid').returns(Promise.resolve(null));

    const received = await usecase.obtainUserByUuid(v4());

    expect(received).toBeFalsy();
  });

  describe('rollbackUserInitialization()', () => { 
    describe('Should rollback the user properly', () => {
      it('Should rollback if only bucket was initialized', async () => {
        stub(network, 'deleteBucket').returns(Promise.resolve());

        const received = await usecase.rollbackUserInitialization(
          network,
          bucketId,
          null
        );

        expect(received).toBeNull();
      });

      it('Should rollback if bucket and user were initialized', async () => {
        stub(network, 'deleteBucket').returns(Promise.resolve());
        stub(usersRepository, 'deleteById').returns(Promise.resolve());

        const received = await usecase.rollbackUserInitialization(
          network,
          bucketId,
          userId,
        );

        expect(received).toBeNull();  
      });

      it('Should rollback if bucket, user and device were initialized', async () => {
        stub(network, 'deleteBucket').returns(Promise.resolve());
        stub(usersRepository, 'deleteById').returns(Promise.resolve());
        stub(devicesRepository, 'deleteById').returns(Promise.resolve());

        const received = await usecase.rollbackUserInitialization(
          network,
          bucketId,
          userId
        );

        expect(received).toBeNull();  
      });
    });

    it('Should throw if bucket deletion fails', async () => {
      const errorMessage = 'Delete bucket failed';

      stub(network, 'deleteBucket').rejects(new Error(errorMessage));

      const rollbackInitError = await usecase.rollbackUserInitialization(
        network,
        bucketId,
        null
      );

      expect(rollbackInitError).toBeInstanceOf(Error);
      expect(rollbackInitError?.message).toContain(errorMessage);
    });

    it('Should throw if user deletion fails', async () => {
      const errorMessage = 'Delete user failed';

      stub(network, 'deleteBucket').resolves();
      stub(usersRepository, 'deleteById').rejects(new Error(errorMessage));

      const rollbackInitError = await usecase.rollbackUserInitialization(
        network,
        bucketId,
        userId
      );

      expect(rollbackInitError).toBeInstanceOf(Error);
      expect(rollbackInitError?.message).toContain(errorMessage);
    });
  });

  describe('initUser()', () => {
    const deviceName = 'deviceName';
    const deviceMac = 'deviceMac';
    const uuid = v4();
    const deviceInfo = { mac: deviceMac, name: deviceName };

    it('Should init the user properly', async () => {
      stub(usecase, 'isUserAlreadyInitialized').resolves(false);
      stub(network, 'createBucket').resolves(bucketId);
      stub(usersRepository, 'create').resolves(userId);
      stub(devicesRepository, 'create').resolves(deviceId);

      const rollbackStub = stub(usecase, 'rollbackUserInitialization');
      const initializedUserId = await usecase.initUser(uuid, network, deviceInfo);

      expect(initializedUserId).toEqual(userId);
      expect(rollbackStub.callCount).toBe(0);
    });

    it('Should throw if user already exists', async () => {
      stub(usecase, 'isUserAlreadyInitialized').resolves(true);

      expect(usecase.initUser(uuid, network, deviceInfo)).rejects.toEqual(Error('User already exists'));
    });

    describe('Should rollback if required when user init fails', () => {
      it('Should not rollback if bucket creation fails', async () => {
        const errorMessage = 'Bucket creation failed';

        stub(usecase, 'isUserAlreadyInitialized').resolves(false);
        stub(network, 'createBucket').rejects(new Error(errorMessage));
        
        const rollbackStub = stub(usecase, 'rollbackUserInitialization');

        try {
          await usecase.initUser(uuid, network, deviceInfo);
          expect(true).toBeFalsy();
        } catch (err) {
          expect(err).toBeInstanceOf(Error);
          expect(rollbackStub.callCount).toBe(0);
        }
      });

      it('Should rollback if user creation fails', async () => {
        const errorMessage = 'User creation failed';

        stub(usecase, 'isUserAlreadyInitialized').resolves(false);
        stub(network, 'createBucket').resolves(bucketId);
        stub(usersRepository, 'create').rejects(new Error(errorMessage));
        
        const rollbackStub = stub(usecase, 'rollbackUserInitialization');

        try {
          await usecase.initUser(uuid, network, deviceInfo);
          expect(true).toBeFalsy();
        } catch (err) {
          expect(err).toBeInstanceOf(Error);
          expect(rollbackStub.callCount).toBe(1);
          expect(rollbackStub.calledWith(network, bucketId, null));
        }
      });

      it('Should rollback if device creation fails', async () => {
        const errorMessage = 'Device creation failed';

        stub(usecase, 'isUserAlreadyInitialized').resolves(false);
        stub(network, 'createBucket').resolves(bucketId);
        stub(usersRepository, 'create').resolves(userId);
        stub(devicesRepository, 'create').rejects(new Error(errorMessage));
        
        const rollbackStub = stub(usecase, 'rollbackUserInitialization');

        try {
          await usecase.initUser(uuid, network, deviceInfo);
          expect(true).toBeFalsy();
        } catch (err) {
          expect(err).toBeInstanceOf(Error);
          expect(rollbackStub.callCount).toBe(1);
          expect(rollbackStub.calledWith(network, bucketId, userId));
        }
      });
    });
  });
});