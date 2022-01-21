import { ObjectId } from 'mongodb';
import { config } from 'dotenv';

import { DevicesRepository } from '../../../src/api/devices/repository';
import { MongoDB } from '../../../src/database/MongoDB';
import { devices } from '../../../src/database/mongo/fixtures/devices';
import { getRandomString } from '../../utils';

config();

if (!process.env.DATABASE_URI) {
  throw new Error('Missing DATABASE_URI env variable');
}

const database = new MongoDB(process.env.DATABASE_URI);
let repository: DevicesRepository;

const deviceToBeDeleted = { ...devices[0] };
const alwaysExistingDevice = { ...devices[1] };

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

describe('Devices repository', () => {
  it('getById()', async () => {
    const alreadyExistentDevice = alwaysExistingDevice;
    const expected = { 
      ...alreadyExistentDevice, 
      id: alreadyExistentDevice._id.toString(),
      userId: alreadyExistentDevice.userId.toString()
    };
    const device = await repository.getById(alreadyExistentDevice._id.toString());

    expect(device).not.toBeNull();

    const received = { ...device, _id: alreadyExistentDevice._id }; 

    expect(received).toStrictEqual(expected);
  });

  it('get()', async () => {
    const alreadyExistentDevice = alwaysExistingDevice;
    const expected = { 
      ...alreadyExistentDevice, 
      id: alreadyExistentDevice._id.toString(),
      userId: alreadyExistentDevice.userId.toString()
    };
    const [device] = await repository.get({ mac: alreadyExistentDevice.mac });

    expect(device).not.toBeNull();

    const received = { ...device, _id: alreadyExistentDevice._id }; 

    expect(received).toStrictEqual(expected);
  });

  it('create()', async () => {
    const received = await repository.create({
      mac: getRandomString(12),
      name: getRandomString(12),
      userId: getRandomString(12),
    });

    expect(received).not.toBeNull();
    expect(() => new ObjectId(received.id)).not.toThrow();

    await repository.deleteById(received.id);
  });

  it('update()', () => {
    expect(repository.update()).rejects.toEqual('Not implemented yet');
  });

  it('deleteById()', async () => {
    const alreadyExistentDevice = deviceToBeDeleted;

    await repository.deleteById(alreadyExistentDevice._id.toString('hex'));

    const received = await repository.getById(alreadyExistentDevice._id.toString());

    expect(received).toBeNull();
  });

  it('delete()', async () => {
    const alreadyExistentDevice = deviceToBeDeleted;

    await repository.delete({ mac: alreadyExistentDevice.mac });

    const received = await repository.getById(alreadyExistentDevice._id.toString());

    expect(received).toBeNull();
  });
});
