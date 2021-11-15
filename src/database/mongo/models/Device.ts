import { ObjectId } from 'bson';
import { Device } from '../../../models/Device';

export interface DeviceDocument extends Device {
  _id?: ObjectId
  createdAt: Date,
  updatedAt: Date
}
