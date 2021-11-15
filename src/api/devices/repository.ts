import { ObjectId } from 'mongodb';

import { Repository } from '../../core/Repository';
import { DeviceDocument } from '../../database/mongo/models/Device';
import { collections } from '../../database/MongoDB';
import { Device, DeviceId } from '../../models/Device';

function toObjectId(id: string) {
  return new ObjectId(id);
}

const devicesRepository: Repository<Device> = {
  getById(id: string) {
    return collections.devices!.findOne<DeviceDocument>({ _id: toObjectId(id) })
      .then((doc) => {
        if (!doc || !doc._id) {
          return doc;
        }

        const id = doc._id.toString();

        return { id, name: doc.name, mac: doc.mac };
      });
  },
  get(where: Record<string, unknown>) {
    return collections.devices!
      .find<Device>(where)
      .toArray()
      .then((results) => results as Device[]);
  },
  create(device: Omit<Device, 'id'>): Promise<DeviceId> {
    const document: Omit<DeviceDocument, 'id'> = {
      mac: device.mac,
      name: device.name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  
    return collections.devices!
      .insertOne(document)
      .then(({ insertedId }) => insertedId.toString());
  },
  update() {
    return Promise.reject('Not implemented yet');
  },
  async deleteById(id) {
    await collections.devices!.deleteOne({ _id: toObjectId(id) });
  },
  async delete(where) {
    await collections.devices!.deleteMany(where);
  }
};

export default devicesRepository;
