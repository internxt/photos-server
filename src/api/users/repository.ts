import { Collection, Document, Filter, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { UserDocument } from '../../database/mongo/models/User';
import { GalleryUsage, User, UserId } from '../../models/User';

function toObjectId(id: string) {
  return new ObjectId(id);
}

function mongoDocToModel(doc: UserDocument): User {
  const id = doc._id.toString();

  return { ...doc, id };
}


export class UsersRepository implements Repository<User> {
  private collection: Collection<UserDocument>;

  constructor(collection: Collection<UserDocument>) {
    this.collection = collection;
  }

  getById(id: UserId): Promise<User | null> {
    return this.collection.findOne<UserDocument>({ _id: toObjectId(id) }).then((doc): User | null => {
      if (!doc || !doc._id) {
        return null;
      }

      const id = doc._id.toString();

      return { ...doc, id };
    });
  }

  getByUuid(uuid: string): Promise<User | null> {
    return this.collection.findOne({ uuid })
      .then((doc: UserDocument | null) => {
        if (!doc || !doc._id) {
          return null;
        }

        return mongoDocToModel(doc);
      });
  }
  
  getByBucket(bucketId: User['bucketId']): Promise<User | null> {
    return this.collection.findOne({ bucketId })
      .then((doc: UserDocument | null) => {
        if (!doc || !doc._id) {
          return null;
        }

        return mongoDocToModel(doc);
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get(where: Filter<UserDocument>) {
    return Promise.reject('Not implemented yet');
  }

  create(user: Omit<User, 'id'>): Promise<User> {
    const document: Omit<UserDocument, '_id'> = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.collection.insertOne(document).then(({ insertedId }) => {
      return {
        id: insertedId.toString(),
        ...user
      };
    });
  }

  update() {
    return Promise.reject('Not implemented yet');
  }

  updateGalleryUsage(user: User, sizeIncrement: GalleryUsage) {
    if (user) {
      const newGalleryUsage = (user?.galleryUsage || 0) + sizeIncrement;
      return this.collection.updateOne(
        { _id: toObjectId(user.id) },
        {
          $set: {
            ...user,
            galleryUsage: newGalleryUsage,
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  async deleteById(id: UserId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(where: Filter<Document>) {
    return Promise.reject('Not implemented yet');
  }
}
