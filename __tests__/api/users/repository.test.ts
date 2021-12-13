import { ObjectId } from 'mongodb';
import { config } from 'dotenv';
import { v4 } from 'uuid';

import { UsersRepository } from '../../../src/api/users/repository';
import { MongoDB } from '../../../src/database/MongoDB';
import { users } from '../../../src/database/mongo/fixtures/users';

config();

if (!process.env.DATABASE_URI) {
  throw new Error('Missing DATABASE_URI env variable');
}

const database = new MongoDB(process.env.DATABASE_URI);
let repository: UsersRepository;

beforeAll((ready) => {
  database.connect().then(() => {
    repository = new UsersRepository(database.getCollections().users);
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

describe('Users repository', () => {
  it('getById()', async () => {
    const alreadyExistentUser = { ...users[0] };
    const expected = { ...alreadyExistentUser, id: alreadyExistentUser._id.toString() };
    const user = await repository.getById(alreadyExistentUser._id.toString());

    expect(user).not.toBeNull();

    const received = { ...user, _id: alreadyExistentUser._id }; 

    expect(received).toStrictEqual(expected);
  });

  it('get()', async () => {
    expect(repository.get({})).rejects.toEqual('Not implemented yet');
  });

  it('create()', async () => {
    const received = await repository.create({
      uuid: v4(),
      bucketId: ''
    });

    expect(received).not.toBeNull();
    expect(() => new ObjectId(received)).not.toThrow();

    await repository.deleteById(received);
  });

  it('update()', async () => {
    expect(repository.update()).rejects.toEqual('Not implemented yet');
  });

  it('deleteById()', async () => {
    const alreadyExistentUser = { ...users[0] };

    await repository.deleteById(alreadyExistentUser._id.toString('hex'));

    const received = await repository.getById(alreadyExistentUser._id.toString());

    expect(received).toBeNull();
  });

  it('delete()', async () => {
    expect(repository.update()).rejects.toEqual('Not implemented yet');
  });
});
