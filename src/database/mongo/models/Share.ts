import { ObjectId } from 'mongodb';

import { Share } from '../../../models/Share';

export interface ShareDocument extends Omit<Share, 'id' | 'photoId'> {
  _id: ObjectId;
  photoId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
