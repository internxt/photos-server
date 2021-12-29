import { Device, DeviceId } from '../../models/Device';
import { DevicesRepository } from './repository';

export class DevicesUsecase {
  private repository: DevicesRepository;

  constructor(repo: DevicesRepository) {
    this.repository = repo;
  }

  obtainDevice(deviceId: DeviceId): Promise<Device | null> {
    return this.repository.getById(deviceId);
  }

  async saveDevice(device: Omit<Device, 'id'>): Promise<Device> {
    const alreadyExistentDevice = await this.repository.getByMac(device.mac);

    if (alreadyExistentDevice) {
      if (alreadyExistentDevice.userId !== device.userId) {
        throw new Error('Device not owned by this user');
      } else {
        return alreadyExistentDevice;
      }
    }

    return this.repository.create(device);
  }

  removeDevice(deviceId: string): Promise<void> {
    return this.repository.deleteById(deviceId);
  }
}
