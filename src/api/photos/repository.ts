import { Collection, Document, Filter, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { PhotoDocument } from '../../database/mongo/models/Photo';
import { Photo, PhotoId } from '../../models/Photo';

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

  get(filter: Partial<Photo>, skip = 0, limit = 0) {
    return this.getCursor(filter)
      .skip(skip)
      .limit(limit)
      .toArray()
      .then((results) => {
        return results.map(mongoDocToModel);
      });
  }

  count(filter: Partial<Photo>) {
    return this.getCursor(filter).count();
  }

  create(photo: Omit<Photo, 'id'>): Promise<Photo> {
    const now = new Date();
    const document: Omit<PhotoDocument, '_id'> = {
      ...photo,
      userId: toObjectId(photo.userId),
      deviceId: toObjectId(photo.deviceId),
      createdAt: now,
      updatedAt: now
    };

    return this.collection.insertOne(document).then(({ insertedId }) => {
      return { id: insertedId.toString(), ...photo, createdAt: now, updatedAt: now };
    });
  }

  update() {
    return Promise.reject('Not implemented yet');
  }

  updateById(photoId: PhotoId, updatedPhoto: Partial<PhotoDocument>) {
    return this.collection.updateOne({ _id: toObjectId(photoId) }, 
      {$set: {
        ...updatedPhoto,
        updatedAt: new Date()
      }}
    );
  }

  async deleteById(id: PhotoId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<Document>) {
    await this.collection.deleteMany(where);
  }

  private getCursor({name, userId, status, statusChangedAt, deviceId }: Partial<Photo>) {
    const filter: Filter<PhotoDocument> = {};

    name ? filter.name = name : null;
    status ? filter.status = status : null;
    userId ? filter.userId = toObjectId(userId) : null;
    statusChangedAt ? filter.statusChangedAt = {
        $gte: statusChangedAt
      } : null;
    deviceId ? filter.deviceId = toObjectId(deviceId) : null;

    return this.collection
      .find<PhotoDocument>(filter);
  }
}
