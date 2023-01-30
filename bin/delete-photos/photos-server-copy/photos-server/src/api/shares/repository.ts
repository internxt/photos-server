import { Collection, Document, Filter, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { ShareDocument } from '../../database/mongo/models/Share';
import { Share, ShareId } from '../../models/Share';

function toObjectId(id: string) {
  return new ObjectId(id);
}

function mongoDocToModel(doc: ShareDocument): Share {
  const id = doc._id.toString();
  const photoIds = doc.photoIds.map((id) => id.toString());

  return { ...doc, id, photoIds };
}

export class SharesRepository implements Repository<Share> {
  private collection: Collection<ShareDocument>;

  constructor(collection: Collection<ShareDocument>) {
    this.collection = collection;
  }

  getById(id: ShareId): Promise<Share | null> {
    return this.collection.findOne<ShareDocument>({ _id: toObjectId(id) }).then((doc): Share | null => {
      if (!doc || !doc._id) {
        return null;
      }

      return mongoDocToModel(doc);
    });
  }

  getByToken(token: string): Promise<Share | null> {
    return this.collection.findOne<ShareDocument>({ token }).then((doc): Share | null => {
      if (!doc || !doc._id) {
        return null;
      }

      return mongoDocToModel(doc);
    });
  }

  get(where: Filter<ShareDocument>) {
    return this.collection
      .find<ShareDocument>(where)
      .toArray()
      .then((results) => {
        return results.map(mongoDocToModel);
      });
  }

  create(share: Omit<Share, 'id'>): Promise<Share> {
    const document: Omit<ShareDocument, '_id'> = {
      ...share,
      photoIds: share.photoIds.map((id) => toObjectId(id)),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.collection.insertOne(document).then(({ insertedId }) => {
      return {
        id: insertedId.toString(),
        ...share,
      };
    });
  }

  update() {
    return Promise.reject('Not implemented yet');
  }

  async updateById(id: string, merge: Omit<Partial<ShareDocument>, 'id'>) {
    await this.collection.updateOne({ _id: toObjectId(id) }, { $set: { ...merge, updatedAt: new Date() } });
  }

  async deleteById(id: ShareId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<Document>) {
    await this.collection.deleteMany(where);
  }
}
