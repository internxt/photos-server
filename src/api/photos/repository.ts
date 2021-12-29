import { Collection, Document, Filter, FindCursor, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { PhotoDocument } from '../../database/mongo/models/Photo';
import { Photo, PhotoId } from '../../models/Photo';
import { UserId } from '../../models/User';

function toObjectId(id: string) {
  return new ObjectId(id);
}

function mongoDocToModel(doc: PhotoDocument): Photo {
  const id = doc._id.toString();
  const userId = doc.userId.toString();
  const deviceId = doc.deviceId.toString();

  return { ...doc, id, deviceId, userId };
}

export class PhotosRepository implements Repository<Photo> {
  private collection: Collection<PhotoDocument>;

  constructor(collection: Collection<PhotoDocument>) {
    this.collection = collection;
  }

  getById(id: PhotoId): Promise<Photo | null> {
    return this.collection.findOne<PhotoDocument>({ _id: toObjectId(id) }).then((doc): Photo | null => {
      if (!doc || !doc._id) {
        return null;
      }

      return mongoDocToModel(doc);
    });
  }

  get(where: Filter<PhotoDocument>) {
    return this.collection
      .find<PhotoDocument>(where)
      .toArray()
      .then((results) => {
        return results.map(mongoDocToModel);
      });
  }

  getByUserIdAndAfterDate(
    userId: UserId, 
    from: Date,
    where: Filter<PhotoDocument>,
    skip: number, 
    limit: number
  ): Promise<Photo[]> {
    return this.collection
      .find<PhotoDocument>({ 
        ...where,
        userId: toObjectId(userId),
        lastStatusChangeAt: {
          $gte: from
        }
      })
      .skip(skip)
      .limit(limit)
      .toArray()
      .then((results) => {
        return results.map(mongoDocToModel);
      });
  }

  getCountByDate(userId: string, from: Date, to: Date, limit: number, offset: number): Promise<number> {
    return this.getByDateRangesRaw(userId, from, to, limit, offset).count();
  }

  getByDateRanges(userId: string, from: Date, to: Date, limit: number, offset: number): Promise<Photo[]> {
    return this.getByDateRangesRaw(userId, from, to, limit, offset).toArray();
  }

  create(photo: Omit<Photo, 'id'>): Promise<Photo> {
    const document: Omit<PhotoDocument, '_id'> = {
      ...photo,
      userId: toObjectId(photo.userId),
      deviceId: toObjectId(photo.deviceId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.collection.insertOne(document).then(({ insertedId }) => {
      return { id: insertedId.toString(), ...photo };
    });
  }

  update() {
    return Promise.reject('Not implemented yet');
  }

  updateById(photoId: PhotoId, updatedPhoto: Partial<Photo>) {
    return this.collection.updateOne({ _id: toObjectId(photoId) }, {
      ...updatedPhoto,
      updatedAt: new Date()
    });
  }

  async deleteById(id: PhotoId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<Document>) {
    await this.collection.deleteMany(where);
  }

  private getByDateRangesRaw(userId: string, from: Date, to: Date, limit: number, offset: number): FindCursor<Photo> {
    return this.collection
      .find<Photo>({
        userId: toObjectId(userId),
        $gte: { creationDate: from },
        $lte: { creationDate: to },
      })
      .skip(offset)
      .limit(limit);
  }
}
