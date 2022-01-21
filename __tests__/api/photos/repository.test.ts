import { ObjectId } from 'mongodb';
import { config } from 'dotenv';

import { PhotosRepository } from '../../../src/api/photos/repository';
import { MongoDB } from '../../../src/database/MongoDB';
import { photos } from '../../../src/database/mongo/fixtures/photos';
import { PhotoStatus } from '../../../src/models/Photo';
import { getRandomString } from '../../utils';

config();

if (!process.env.DATABASE_URI) {
  throw new Error('Missing DATABASE_URI env variable');
}

const database = new MongoDB(process.env.DATABASE_URI);
let repository: PhotosRepository;

const photoToBeDeleted = { ...photos[0] };
const existingPhoto = { ...photos[1] };

beforeAll((ready) => {
  database.connect().then(() => {
    repository = new PhotosRepository(database.getCollections().photos);
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

describe('Photos repository methods', () => {
  it('getById()', async () => {
    const alreadyExistentPhoto = existingPhoto;
    const expected = { 
      ...alreadyExistentPhoto, 
      id: alreadyExistentPhoto._id.toString(),
      deviceId: alreadyExistentPhoto.deviceId.toString(),
      userId: alreadyExistentPhoto.userId.toString()
    };
    const photo = await repository.getById(alreadyExistentPhoto._id.toString());

    expect(photo).not.toBeNull();

    const received = { ...photo, _id: alreadyExistentPhoto._id }; 

    expect(received).toStrictEqual(expected);
  });

  it('get()', async () => {
    const alreadyExistentPhoto = existingPhoto;
    const expected = { 
      ...alreadyExistentPhoto, 
      id: alreadyExistentPhoto._id.toString(),
      deviceId: alreadyExistentPhoto.deviceId.toString(),
      userId: alreadyExistentPhoto.userId.toString()
    };

    const [photo] = await repository.get({ name: alreadyExistentPhoto.name });

    expect(photo).not.toBeNull();

    const received = { ...photo, _id: alreadyExistentPhoto._id }; 

    expect(received).toStrictEqual(expected);
  });

  it('create()', async () => {
    const alreadyExistentPhoto = { ...photos[0] };
    const received = await repository.create({
      deviceId: alreadyExistentPhoto.deviceId.toString(),
      fileId: alreadyExistentPhoto.fileId,
      height: alreadyExistentPhoto.height,
      name: getRandomString(10),
      previewId: alreadyExistentPhoto.previewId,
      size: alreadyExistentPhoto.size,
      type: alreadyExistentPhoto.type,
      userId: alreadyExistentPhoto.userId.toString(),
      width: alreadyExistentPhoto.width,
      status: PhotoStatus.Exists,
      takenAt: new Date(),
      statusChangedAt: new Date()
    });

    expect(received).not.toBeNull();
    expect(() => new ObjectId(received.id)).not.toThrow();

    await repository.deleteById(received.id);
  });

  it('update()', () => {
    expect(repository.update()).rejects.toEqual('Not implemented yet');
  });

  it('deleteById()', async () => {
    const alreadyExistentPhoto = { ...photos[0] };

    await repository.deleteById(alreadyExistentPhoto._id.toString('hex'));

    const received = await repository.getById(alreadyExistentPhoto._id.toString());

    expect(received).toBeNull();
  });

  it('delete()', async () => {
    const alreadyExistentPhoto = photoToBeDeleted;

    await repository.delete({ name: alreadyExistentPhoto.name });

    const received = await repository.getById(alreadyExistentPhoto._id.toString());

    expect(received).toBeNull();
  });
});
