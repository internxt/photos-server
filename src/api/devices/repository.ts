import { Collection, Document, Filter, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { DeviceDocument } from '../../database/mongo/models/Device';
import { Device, DeviceId } from '../../models/Device';

function toObjectId(id: string) {
  return new ObjectId(id);
}
export class DevicesRepository implements Repository<Device> {
  private collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  getById(id: string) {
    return this.collection.findOne<DeviceDocument>({ _id: toObjectId(id) })
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
      .find<Device>(where)
      .toArray()
      .then((results) => results as Device[]);
  }

  create(device: Omit<Device, 'id'>): Promise<DeviceId> {
    const document: Omit<DeviceDocument, 'id'> = {
      ...device,
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

  async deleteById(id: DeviceId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<Document>) {
    await this.collection.deleteMany(where);
  }
}
