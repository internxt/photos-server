import { UsecaseError } from '../../core/Usecase';
import { Device, DeviceId } from '../../models/Device';
import { UsersRepository } from '../users/repository';
import { DevicesRepository } from './repository';

export class DevicesUsecase {
  private readonly devicesRepository: DevicesRepository;
  private readonly usersRepository: UsersRepository;

  constructor(devicesRepository: DevicesRepository, usersRepository: UsersRepository) {
    this.devicesRepository = devicesRepository;
    this.usersRepository = usersRepository;
  }

  getDeviceById(deviceId: DeviceId): Promise<Device | null> {
    return this.devicesRepository.getById(deviceId);
  }
  
  async get(
    userUuid: string
  ): Promise<Device[]> {
    const user = await this.usersRepository.getByUuid(userUuid);

    if (!user) {
      throw new UsecaseError(`User with uuid ${userUuid} does not exist`);
    }
    
    const results = await this.devicesRepository.get({userId: user.id });

    return results;
  }

  async saveDevice(data: Pick<Device, 'mac' | 'userId' | 'name'>): Promise<Device> {
    const alreadyExistentDevice = await this.devicesRepository.getByUserIdAndMac(data.userId, data.mac);
    
    return alreadyExistentDevice || this.devicesRepository.create(data);
  }

  async fixMacAddress({ userId, mac, uniqueId}: { userId: string, mac: string, uniqueId: string}) {
    const alreadyExistentDevice = await this.devicesRepository.getByUserIdAndMac(userId, mac);

    if (alreadyExistentDevice?.userId === userId) {
      await this.devicesRepository.fixMacAddress({userId, mac, uniqueId});
    }
  }

  updateNewestDate(deviceId: string, newestDate: Date) {
    return this.devicesRepository.updateById(deviceId, { newestDate });
  }

  updateOldestDate(deviceId: string, oldestDate: Date) {
    return this.devicesRepository.updateById(deviceId, { oldestDate });
  }

  removeDevice(deviceId: string): Promise<void> {
    return this.devicesRepository.deleteById(deviceId);
  }
}
