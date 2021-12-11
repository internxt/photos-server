import { Collection, Document, Filter, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { UserDocument } from '../../database/mongo/models/User';
import { User, UserId } from '../../models/User';

function toObjectId(id: string) {
  return new ObjectId(id);
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

  get(where: Filter<UserDocument>) {
    return Promise.reject('Not implemented yet');
  }

  create(user: User): Promise<UserId> {
    const document: Omit<UserDocument, '_id'> = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.collection.insertOne(document).then(({ insertedId }) => insertedId.toString());
  }

  update() {
    return Promise.reject('Not implemented yet');
  }

  async deleteById(id: UserId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<Document>) {
    return Promise.reject('Not implemented yet');
  }
}
