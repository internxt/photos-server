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

  getByMultipleIds(id: PhotoId[], skip: number, limit: number): Promise<Photo[]> {
    return this.collection
      .find<PhotoDocument>({ _id: { $in: id.map(toObjectId) } })
      .skip(skip)
      .limit(limit)
      .toArray()
      .then((docs) => docs.map(mongoDocToModel));
  }

   /**
   * Gets multiple photos based on the conditions. 
   * All the conditions should have the same fields.
   * @param where 
   * @returns 
   */
    getByMultipleWhere(photoConditions: Partial<Photo>[]): Promise<Photo[]> {
      const where: Record<string, Record<'$in', unknown[]>> = {};
  
      for (const conditions of photoConditions) {
        Object.keys(conditions).forEach((key) => {
          if (where[key]) {
            if (key === 'userId') {
              where[key].$in.push(new ObjectId(conditions[key as keyof Photo] as string));
            } else {
              where[key].$in.push(conditions[key as keyof Photo]);
            }
          } else {
            if (key === 'userId') {
              where[key] = { $in: [ new ObjectId(conditions[key as keyof Photo] as string) ] };
            } else {
              where[key] = { $in: [ conditions[key as keyof Photo] ] };
            }
          }
        });
      }
  
      return this.collection
        .find<PhotoDocument>(where).toArray()
        .then((docs) => docs.map(mongoDocToModel));
    }

  get(filter: Partial<Photo>, skip = 0, limit = 1) {
    return this.getCursor(filter)
      .skip(skip)
      .limit(limit)
      .toArray()
      .then((results) => {
        return results.map(mongoDocToModel);
      });
  }

  getOne({name, takenAt}: Partial<Photo>) {
    const filter: Filter<PhotoDocument> = {};
    name ? (filter.name = name) : null;
    takenAt ? (filter.takenAt = takenAt) : null;
    
    return this.collection.findOne<PhotoDocument>(filter).then((doc): Photo | null => {
      if (!doc || !doc._id) {
        return null;
      }

      return mongoDocToModel(doc);
    });
  }



  async getUsage(userId: string): Promise<number> {
    const result: { _id: null; usage: number } | null = await this.collection
      .aggregate<{ _id: null; usage: number }>([
        { $match: { userId: toObjectId(userId) } },
        {
          $group: {
            _id: null,
            usage: { $sum: '$size' },
          },
        },
      ])
      .next();

    return result?.usage || 0;
  }

  count(filter: Partial<Photo>) {
    return this.getCursor(filter).count();
  }

  create(data: Omit<Photo, 'id'>): Promise<Photo> {
    const now = new Date();
    const previews = data.previews || [];
    const document: Omit<PhotoDocument, '_id'> = {
      ...data,
      previews,
      userId: toObjectId(data.userId),
      deviceId: toObjectId(data.deviceId),
      createdAt: now,
      updatedAt: now,
    };

    return this.collection.insertOne(document).then(({ insertedId }) => {
      return { id: insertedId.toString(), ...data, previews, createdAt: now, updatedAt: now };
    });
  }

  update() {
    return Promise.reject('Not implemented yet');
  }

  updateById(photoId: PhotoId, updatedPhoto: Partial<PhotoDocument>) {
    return this.collection.updateOne(
      { _id: toObjectId(photoId) },
      {
        $set: {
          ...updatedPhoto,
          updatedAt: new Date(),
        },
      },
    );
  }

  async deleteById(id: PhotoId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<Document>) {
    await this.collection.deleteMany(where);
  }

  private getCursor({ name, userId, status, statusChangedAt, deviceId }: Partial<Photo>) {
    const filter: Filter<PhotoDocument> = {};

    name ? (filter.name = name) : null;
    status ? (filter.status = status) : null;
    userId ? (filter.userId = toObjectId(userId)) : null;
    statusChangedAt
      ? (filter.statusChangedAt = {
          $gte: statusChangedAt,
        })
      : null;
    deviceId ? (filter.deviceId = toObjectId(deviceId)) : null;

    return this.collection.find<PhotoDocument>(filter).sort({ takenAt: 'desc' });
  }
}
