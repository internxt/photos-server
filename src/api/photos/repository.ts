import { Collection, Document, Filter, FindCursor, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { PhotoDocument } from '../../database/mongo/models/Photo';
import { Photo, PhotoId } from '../../models/Photo';

function toObjectId(id: string) {
  return new ObjectId(id);
}

export class PhotosRepository implements Repository<Photo> {
  private collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  getById(id: PhotoId) {
    return this.collection.findOne<PhotoDocument>({ _id: toObjectId(id) })
      .then((doc) => {
        if (!doc || !doc._id) {
          return doc;
        }

        const id = doc._id.toString();

        delete doc._id;

        return { ...doc, id };
      });
  }

  get(where: Record<string, unknown>) {
    return this.collection
      .find<Photo>(where)
      .toArray()
      .then((results) => results as Photo[]);
  }

  getCountByDate(userUuid: string, from: Date, to: Date, limit: number, offset: number): Promise<number> {
    return this.getByDateRangesRaw(userUuid, from, to, limit, offset).count();
  }

  getByDateRanges(userUuid: string, from: Date, to: Date, limit: number, offset: number): Promise<Photo[]> {
    return this.getByDateRangesRaw(userUuid, from, to, limit, offset).toArray();
  }

  create(photo: Omit<Photo, 'id'>): Promise<PhotoId> {
    const document: Omit<PhotoDocument, 'id'> = {
      ...photo,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  
    return this.collection
      .insertOne(document)
      .then(({ insertedId }) => insertedId.toString());
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
        $lte: { createdAt: to }
      })
      .skip(offset)
      .limit(limit);
  }
}
