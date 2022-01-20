import { ObjectId } from 'mongodb';
import { Device } from '../../../models/Device';

export interface DeviceDocument extends Omit<Device, 'id' | 'userId'> {
  _id: ObjectId;
  userId: ObjectId;
  newestDate: Date;
  oldestDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
