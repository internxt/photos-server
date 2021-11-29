import { ObjectId } from 'mongodb';
import { Device } from '../../../models/Device';

export interface DeviceDocument extends Omit<Device, 'id'> {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
