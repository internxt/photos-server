import { ObjectId } from 'mongodb';

import { Photo } from '../../../models/Photo';

export interface PhotoDocument extends Omit<Photo, 'id' | 'userId' | 'deviceId'> {
  _id: ObjectId;
  userId: ObjectId;
  deviceId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
