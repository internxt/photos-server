import { Environment } from '@internxt/inxt-js';

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

  async initUser(userId: UserId, deviceInfo: Omit<Device, 'id' | 'userId'>): Promise<UserId> {
    const userAlreadyExists = await this.isUserAlreadyInitialized(userId);

    if (userAlreadyExists) {
      throw new Error('User already exists');
    }

    let deviceId: DeviceId = "";
    let bucketId: string = "";

    const network = new Environment({
      bridgePass: '',
      bridgeUser: '',
      bridgeUrl: process.env.NETWORK_URL
    });

    try {
      bucketId = await network.createBucket(`Photos-${userId}`);

      const newDevice: Omit<Device, 'id'> = { ...deviceInfo, userId };
      // TODO: Does this device already exist? (look by name?? index name???)
      deviceId = await this.devicesRepository.create(newDevice);

      const newUser: User = { id: userId, bucketId };

      return this.usersRepository.create(newUser);
    } catch (err) {
      const bucketWasInitialized = bucketId !== "";
      const deviceWasInitialized = deviceId !== "";

      if (bucketWasInitialized) {
        await this.rollbackUserInitialization(userId, bucketId, deviceWasInitialized ? deviceId : null);
      }

      throw err;
    }
  }

  /**
   * Rollbacks an unfinished user initialization with a best effort approach
   */
  private async rollbackUserInitialization(userId: UserId, bucketId: string, deviceId: string | null) {
    const network = new Environment({
      bridgePass: '',
      bridgeUser: '',
      bridgeUrl: process.env.NETWORK_URL
    });

    let bucketDeleted = false;

    try {
      await network.deleteBucket(bucketId);
      bucketDeleted = true;

      if (deviceId) {
        await this.devicesRepository.deleteById(deviceId);
      }
    } catch (err) {
      const message = `User init failed (bucket deleted: ${bucketDeleted ? 'yes' : 'no'}) for user ${userId} due to: ${(err as Error).message}`;
      throw new Error(message);
    }
  }

  async removeUser(userId: UserId): Promise<void> {
    return this.usersRepository.deleteById(userId);
  }
}
