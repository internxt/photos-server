import { ObjectId } from 'mongodb';

import { Photo } from '../../../models/Photo';

export interface PhotoDocument extends Omit<Photo, 'id'> {
  _id: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
