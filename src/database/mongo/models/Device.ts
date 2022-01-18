import { ObjectId } from 'mongodb';
import { Device } from '../../../models/Device';

export interface DeviceDocument extends Omit<Device, 'id' | 'userId'> {
  _id: ObjectId;
  userId: ObjectId;
  synchronizedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
