import { Environment } from '@internxt/inxt-js';

import { Device } from '../../models/Device';
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
    return this.usersRepository.getByUuid(uuid);
  }

  async isUserAlreadyInitialized(uuid: string) {
    const maybeUser: User | null = await this.obtainUserByUuid(uuid);
    
    return !!maybeUser;
  }

  async initUser(
    uuid: string, 
    network: Environment,
    // config: Pick<EnvironmentConfig, 'bridgeUser' | 'bridgePass'>, 
    deviceInfo: Omit<Device, 'id' | 'userId'>
  ): Promise<UserId> {
    const userAlreadyExists = await this.isUserAlreadyInitialized(uuid);

    if (userAlreadyExists) {
      throw new Error('User already exists');
    }

    let userId: UserId = '';
    let bucketId = '';

    // const network = new Environment({ ...config, bridgeUrl: process.env.NETWORK_URL });

    try {
      bucketId = await network.createBucket(`Photos-${uuid}`);

      const newUser: Omit<User, 'id'> = { uuid, bucketId };
      userId = await this.usersRepository.create(newUser);

      // TODO: Does this device already exist? (look by name?? index name???)
      const newDevice: Omit<Device, 'id'> = { ...deviceInfo, userId };
      await this.devicesRepository.create(newDevice);

      return userId;
    } catch (err) {
      const bucketWasInitialized = bucketId !== '';
      const userWasInitialized = userId !== '';

      let finalErrorMessage = 'Error initializing user: ' + (err as Error).message;

      if (bucketWasInitialized) {
        const rollbackError = await this.rollbackUserInitialization(
          network,
          bucketId, 
          userWasInitialized ? userId : null, 
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
  async rollbackUserInitialization(
    network: Environment,
    bucketId: string, 
    userId: UserId | null
  ): Promise<Error | null> {
    let bucketDeleted = false;
    let userDeleted = false;

    try {
      await network.deleteBucket(bucketId);
      bucketDeleted = true;

      if (userId) {
        await this.usersRepository.deleteById(userId);
        userDeleted = true;
      }

      return null;
    } catch (err) {
      const message = 'user init rollback failed'
        + (bucketDeleted ? ' bucket was deleted ' : ` bucket ${bucketId} was not deleted `)
        + (userId && (userDeleted ? ' user was deleted ' : ` user ${userId} was not deleted `))
        + `: ${(err as Error).message}`;

      return new Error(message);
    }
  }

  async removeUser(userId: UserId): Promise<void> {
    return this.usersRepository.deleteById(userId);
  }
}