import { Environment } from '@internxt/inxt-js';

import { Device } from '../../models/Device';
import { User, UserId } from '../../models/User';
import { DevicesRepository } from '../devices/repository';
import { CreateDeviceType } from '../devices/schemas';
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
    deviceInfo: Pick<Device, 'mac' | 'name'>
  ): Promise<User> {
    const maybeUser: User | null = await this.obtainUserByUuid(uuid);
    const userAlreadyExists = !!maybeUser;

    if (userAlreadyExists) {
      return maybeUser;
    }

    let user: User | null = null;
    let bucketId = '';

    try {
      bucketId = await network.createBucket(`Photos-${uuid}`);

      const newUser: Omit<User, 'id'> = { uuid, bucketId };
      user = await this.usersRepository.create(newUser);

      const alreadyCreatedDevice = await this.devicesRepository.getByMac(deviceInfo.mac);

      if (alreadyCreatedDevice && alreadyCreatedDevice.userId !== user.id) {
        throw new Error('Device not owned by this user');
      }

      const newDeviceData: CreateDeviceType = { ...deviceInfo, userId: user.id };
      await this.devicesRepository.create(newDeviceData);

      return user;
    } catch (err) {
      const bucketWasInitialized = bucketId !== '';
      const userWasInitialized = !!user;

      let finalErrorMessage = 'Error initializing user: ' + (err as Error).message;

      if (bucketWasInitialized) {
        const rollbackError = await this.rollbackUserInitialization(
          network,
          bucketId, 
          userWasInitialized ? (user as User).id : null, 
        );

        if (rollbackError) {
          finalErrorMessage += `and ${rollbackError.message}`;
        } else {
          finalErrorMessage += ' | initUser rollback applied successfully';
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
