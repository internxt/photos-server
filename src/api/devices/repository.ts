import { Collection, Filter, ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { DeviceDocument } from '../../database/mongo/models/Device';
import { Device, DeviceId } from '../../models/Device';

function toObjectId(id: string) {
  return new ObjectId(id);
}

function mongoDocToModel(doc: DeviceDocument): Device {
  const id = doc._id.toString();
  const userId = doc.userId.toString();

  return { ...doc, id, userId };
}

function modelToMongoDoc(model: Partial<Device>): Partial<DeviceDocument> {
  const doc: Partial<DeviceDocument> = {};
  const copyModel = Object.assign({}, model);
  delete copyModel.id;
  delete copyModel.userId;

  if (model.id) {
    doc._id = new ObjectId(model.id);
  }

  if (model.userId) {
    doc.userId = new ObjectId(model.userId);
  }

  return { ...doc, ...(copyModel as Omit<Partial<Device>, 'id' | 'userId'>) };
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

      return mongoDocToModel(doc);
    });
  }

  get(filter: Partial<Device>) {
    return this.collection.find(modelToMongoDoc(filter))
      .toArray()
      .then((results) => {
        return results.map(mongoDocToModel);
      });
  }

  getByMac(mac: string): Promise<Device | null> {
    return this.collection.findOne<DeviceDocument>({ mac }).then((doc): Device | null => {
      if (!doc || !doc._id) {
        return null;
      }

      return mongoDocToModel(doc);
    });
  }

  create(device: Omit<Device, 'id' | 'newestDate' | 'oldestDate'>): Promise<Device> {
    const newestDate = new Date('January 1, 1971 00:00:01');
    const oldestDate = null;
    const document: Omit<DeviceDocument, '_id'> = {
      ...device,
      userId: toObjectId(device.userId),
      newestDate,
      oldestDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.collection.insertOne(document).then(({ insertedId }) => {
      return { 
        id: insertedId.toString(),
        ...device,
        newestDate,
        oldestDate
      };
    });
  }

  update() {
    return Promise.reject('Not implemented yet');
  }

  updateById(deviceId: DeviceId, changes: Partial<DeviceDocument>) {
    return this.collection.updateOne({ _id: toObjectId(deviceId) }, 
      {$set: {
        ...changes,
        updatedAt: new Date()
      }}
    );
  }
    
  fixMacAddress({mac, uniqueId}: {mac: string, uniqueId: string}) {
    return this.collection.updateOne({ mac }, 
      {$set: {
        mac: uniqueId,
        updatedAt: new Date()
      }}
    );
  }

  async deleteById(id: DeviceId) {
    await this.collection.deleteOne({ _id: toObjectId(id) });
  }

  async delete(where: Filter<DeviceDocument>) {
    await this.collection.deleteMany(where);
  }
}
