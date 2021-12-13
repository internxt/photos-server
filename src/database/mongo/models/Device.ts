import { ObjectId } from 'mongodb';
import { Device } from '../../../models/Device';

export interface DeviceDocument extends Omit<Device, 'id' | 'userId'> {
  _id: ObjectId;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
