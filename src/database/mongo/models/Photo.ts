import { ObjectId } from 'mongodb';

import { Photo } from '../../../models/Photo';

export interface PhotoDocument extends Photo {
  _id?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
