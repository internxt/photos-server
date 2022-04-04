import { ObjectId } from 'mongodb';

import { Share } from '../../../models/Share';

export interface ShareDocument extends Omit<Share, 'id' | 'photoIds'> {
  _id: ObjectId;
  photoIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
