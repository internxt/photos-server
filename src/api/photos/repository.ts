import { Collection, Document, Filter, FindCursor, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { PhotoDocument } from '../../database/mongo/models/Photo';
import { Photo, PhotoId } from '../../models/Photo';

function toObjectId(id: string) {
  return new ObjectId(id);
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

      const id = doc._id.toString();

      return { ...doc, id };
    });
  }

  get(where: Filter<PhotoDocument>) {
    return this.collection
      .find<PhotoDocument>(where)
      .toArray()
      .then((results) => {
        return results.map((result): Photo => {
          const id = result._id.toString();

          return { ...result, id };
        });
      });
  }

  getCountByDate(userUuid: string, from: Date, to: Date, limit: number, offset: number): Promise<number> {
    return this.getByDateRangesRaw(userUuid, from, to, limit, offset).count();
  }

  getByDateRanges(userUuid: string, from: Date, to: Date, limit: number, offset: number): Promise<Photo[]> {
    return this.getByDateRangesRaw(userUuid, from, to, limit, offset).toArray();
  }

  create(photo: Omit<Photo, 'id'>): Promise<PhotoId> {
    const document: Omit<PhotoDocument, '_id'> = {
      ...photo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.collection.insertOne(document).then(({ insertedId }) => insertedId.toString());
  }

  update() {
    return Promise.reject('Not implemented yet');
  }

  async deleteById(id: PhotoId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<Document>) {
    await this.collection.deleteMany(where);
  }

  private getByDateRangesRaw(userUuid: string, from: Date, to: Date, limit: number, offset: number): FindCursor<Photo> {
    return this.collection
      .find<Photo>({
        userUuid,
        $gte: { createdAt: from },
        $lte: { createdAt: to },
      })
      .skip(offset)
      .limit(limit);
  }
}
