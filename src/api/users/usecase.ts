import { Environment } from '@internxt/inxt-js';
import { EnvironmentConfig } from '@internxt/inxt-js/build/api';

import { Device, DeviceId } from '../../models/Device';
import { User, UserId } from '../../models/User';
import { DevicesRepository } from '../devices/repository';
import { UsersRepository } from './repository';

export class UsersUsecase {
  private usersRepository: UsersRepository;
  private devicesRepository: DevicesRepository;

  constructor(usersRepository: UsersRepository, devicesRepository: DevicesRepository) {
    this.usersRepository = usersRepository;
    this.devicesRepository = devicesRepository;
  }

  obtainUserById(id: UserId) {
    return this.usersRepository.getById(id);
  }

  obtainUserByUuid(uuid: string) {
    return this.usersRepository.get({ uuid });
  }

  async isUserAlreadyInitialized(uuid: string) {
    const maybeUser: User | null = await this.obtainUserByUuid(uuid);
    
    return !!maybeUser;
  }

  async initUser(
    uuid: string, 
    config: Pick<EnvironmentConfig, 'bridgeUser' | 'bridgePass'>, 
    deviceInfo: Omit<Device, 'id' | 'userId'>
  ): Promise<UserId> {
    const userAlreadyExists = await this.isUserAlreadyInitialized(uuid);

    if (userAlreadyExists) {
      throw new Error('User already exists');
    }

    let deviceId: DeviceId = '';
    let userId: UserId = '';
    let bucketId = '';

    const network = new Environment({ ...config, bridgeUrl: process.env.NETWORK_URL });

    try {
      bucketId = await network.createBucket(`Photos-${uuid}`);

      const newUser: Omit<User, 'id'> = { uuid, bucketId };
      userId = await this.usersRepository.create(newUser);

      // TODO: Does this device already exist? (look by name?? index name???)
      const newDevice: Omit<Device, 'id'> = { ...deviceInfo, userId };
      deviceId = await this.devicesRepository.create(newDevice);

      return userId;
    } catch (err) {
      const bucketWasInitialized = bucketId !== '';
      const deviceWasInitialized = deviceId !== '';
      const userWasInitialized = userId !== '';

      let finalErrorMessage = 'Error initializing user: ' + (err as Error).message;

      if (bucketWasInitialized) {
        const rollbackError = await this.rollbackUserInitialization(
          bucketId, 
          userWasInitialized ? userId : null, 
          deviceWasInitialized ? deviceId : null
        );

        if (rollbackError) {
          finalErrorMessage += `and ${rollbackError.message}`;
        }
      }

      throw new Error(finalErrorMessage);
    }
  }

  /**
   * Rollbacks an unfinished user initialization with a best effort approach
   */
  private async rollbackUserInitialization(
    bucketId: string, 
    userId: UserId | null, 
    deviceId: string | null
  ): Promise<Error | null> {
    const network = new Environment({
      bridgePass: '',
      bridgeUser: '',
      bridgeUrl: process.env.NETWORK_URL
    });

    let bucketDeleted = false;
    let userDeleted = false;

    try {
      await network.deleteBucket(bucketId);
      bucketDeleted = true;

      if (userId) {
        await this.usersRepository.deleteById(userId);
        userDeleted = true;
      }

      if (deviceId) {
        await this.devicesRepository.deleteById(deviceId);
      }

      return null;
    } catch (err) {
      const message = 'user init rollback failed';
        + (bucketDeleted ? ' bucket was deleted ' : ` bucket ${bucketId} was not deleted `);
        + (userDeleted ? ' user was deleted ' : ` user ${userId} was not deleted `)
        + `: ${(err as Error).message}`;

      return new Error(message);
    }
  }

  async removeUser(userId: UserId): Promise<void> {
    return this.usersRepository.deleteById(userId);
  }
}
