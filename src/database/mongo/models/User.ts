import { ObjectId } from 'mongodb';

import { User } from '../../../models/User';

export interface UserDocument extends Omit<User, 'id'> {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
