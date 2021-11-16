import { Repository } from '../../core/Repository';
import { Device, DeviceId } from '../../models/Device';

export class DevicesUsecase {
  private repository: Repository<Device>;

  constructor(repo: Repository<Device>) {
    this.repository = repo;
  }

  obtainDevice(deviceId: DeviceId): Promise<Device | null> {
    return this.repository.getById(deviceId);
  }

  saveDevice(device: Omit<Device, 'id'>): Promise<DeviceId> {
    return this.repository.create(device);
  }

  removeDevice(deviceId: string): Promise<void> {
    return this.repository.deleteById(deviceId);
  }
}
