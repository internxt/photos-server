import { Collection, Document, Filter, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { ShareDocument } from '../../database/mongo/models/Share';
import { Share, ShareId } from '../../models/Share';

function toObjectId(id: string) {
  return new ObjectId(id);
}

function mongoDocToModel(doc: ShareDocument): Share {
  const id = doc._id.toString();
  const photoId = doc.photoId.toString();

  return { ...doc, id, photoId };
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

  create(share: Omit<Share, 'id'>): Promise<ShareId> {
    const document: Omit<ShareDocument, '_id'> = {
      ...share,
      photoId: toObjectId(share.photoId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.collection.insertOne(document).then(({ insertedId }) => insertedId.toString());
  }

  update(share: Share) {
    return this.collection.updateOne({ _id: toObjectId(share.id) }, share).then(() => share);
  }

  async deleteById(id: ShareId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<Document>) {
    await this.collection.deleteMany(where);
  }
}
