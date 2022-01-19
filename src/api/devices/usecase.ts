import { UsecaseError } from '../../core/Usecase';
import { Device, DeviceId } from '../../models/Device';
import { UsersRepository } from '../users/repository';
import { DevicesRepository } from './repository';
import { CreateDeviceType } from './schemas';

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

  async saveDevice(device: CreateDeviceType): Promise<Device> {
    const alreadyExistentDevice = await this.devicesRepository.getByMac(device.mac);

    if (alreadyExistentDevice) {
      if (alreadyExistentDevice.userId !== device.userId) {
        throw new Error('Device not owned by this user');
      } else {
        return alreadyExistentDevice;
      }
    }

    return this.devicesRepository.create(device);
  }

  updateSynchronizedAt(deviceId: string, synchronizedAt: Date) {
    return this.devicesRepository.updateById(deviceId, { synchronizedAt });
  }

  removeDevice(deviceId: string): Promise<void> {
    return this.devicesRepository.deleteById(deviceId);
  }
}
