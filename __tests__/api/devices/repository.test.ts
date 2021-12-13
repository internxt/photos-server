import { ObjectId } from 'mongodb';
import { config } from 'dotenv';

import { DevicesRepository } from '../../../src/api/devices/repository';
import { MongoDB } from '../../../src/database/MongoDB';
import { devices } from '../../../src/database/mongo/fixtures/devices';

config();

if (!process.env.DATABASE_URI) {
  throw new Error('Missing DATABASE_URI env variable');
}

const database = new MongoDB(process.env.DATABASE_URI);
let repository: DevicesRepository;

beforeAll((ready) => {
  database.connect().then(() => {
    repository = new DevicesRepository(database.getCollections().devices);
    ready();
  }).catch((err) => {
    ready(err);
  });
});

afterAll((finish) => {
  database.disconnect().then(() => {
    finish();
  }).catch((err) => {
    finish(err);
  });
});

describe('Devices usecases', () => {
  it('getById()', async () => {
    const alreadyExistentDevice = { ...devices[0] };
    const expected = { ...alreadyExistentDevice, id: alreadyExistentDevice._id.toString() };
    const device = await repository.getById(alreadyExistentDevice._id.toString());

    expect(device).not.toBeNull();

    const received = { ...device, _id: alreadyExistentDevice._id }; 

    expect(received).toStrictEqual(expected);
  });

  it('get()', async () => {
    const alreadyExistentDevice = { ...devices[0] };
    const expected = { ...alreadyExistentDevice, id: alreadyExistentDevice._id.toString() };
    const [device] = await repository.get({ mac: alreadyExistentDevice.mac });

    expect(device).not.toBeNull();

    const received = { ...device, _id: alreadyExistentDevice._id }; 

    expect(received).toStrictEqual(expected);
  });

  it('create()', async () => {
    const alreadyExistentDevice = { ...devices[0] };
    const received = await repository.create({
      mac: alreadyExistentDevice.mac,
      name: alreadyExistentDevice.name,
      userId: alreadyExistentDevice.userId
    });

    expect(received).not.toBeNull();
    expect(() => new ObjectId(received)).not.toThrow();

    await repository.deleteById(received);
  });

  it('update()', async () => {
    expect(repository.update()).rejects.toEqual('Not implemented yet');
  });

  it('deleteById()', async () => {
    const alreadyExistentDevice = { ...devices[0] };

    await repository.deleteById(alreadyExistentDevice._id.toString('hex'));

    const received = await repository.getById(alreadyExistentDevice._id.toString());

    expect(received).toBeNull();
  });

  it('delete()', async () => {
    const alreadyExistentDevice = { ...devices[0] };

    await repository.delete({ mac: alreadyExistentDevice.mac });

    const received = await repository.getById(alreadyExistentDevice._id.toString());

    expect(received).toBeNull();
  });
});
