import { Collection, Filter, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { DeviceDocument } from '../../database/mongo/models/Device';
import { Device, DeviceId } from '../../models/Device';

function toObjectId(id: string) {
  return new ObjectId(id);
}
export class DevicesRepository implements Repository<Device> {
  private collection: Collection<DeviceDocument>;

  constructor(collection: Collection<DeviceDocument>) {
    this.collection = collection;
  }

  getById(id: string): Promise<Device | null> {
    return this.collection.findOne<DeviceDocument>({ _id: toObjectId(id) }).then((doc): Device | null => {
      if (!doc || !doc._id) {
        return null;
      }

      const id = doc._id.toString();

      return { ...doc, id };
    });
  }

  get(where: Filter<DeviceDocument>): Promise<Device[]> {
    return this.collection
      .find<DeviceDocument>(where)
      .toArray()
      .then((results) => {
        return results.map((result): Device => {
          const id = result._id.toString();

          return { ...result, id };
        });
      });
  }

  create(device: Omit<Device, 'id'>): Promise<DeviceId> {
    const document: Omit<DeviceDocument, '_id'> = {
      ...device,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.collection.insertOne(document).then(({ insertedId }) => insertedId.toString());
  }

  update() {
    return Promise.reject('Not implemented yet');
  }

  async deleteById(id: DeviceId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<DeviceDocument>) {
    await this.collection.deleteMany(where);
  }
}
