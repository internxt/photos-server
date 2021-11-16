import { ObjectId } from 'mongodb';
import { Device } from '../../../models/Device';

export interface DeviceDocument extends Device {
  _id?: ObjectId
  createdAt: Date,
  updatedAt: Date
}
