/* eslint-disable no-console */
import Fixtures from 'node-mongodb-fixtures';
import { Db, MongoClient } from 'mongodb';

import { config } from 'dotenv';
config();

async function init() {
  if (!process.env.DATABASE_URI) {
    throw new Error('Missing environment variable DATABASE_URI');
  }
  const uri = process.env.DATABASE_URI;
  const mongoClient = new MongoClient(uri);

  try {
    await mongoClient.connect();

    const adminDb = new Db(mongoClient, 'admin').admin();
    const db = mongoClient.db(process.env.DB_NAME);
    const availableDatabases = await adminDb.listDatabases();
    const photosDbExists = availableDatabases.databases.find(d => d.name === 'photos');

    if (!photosDbExists) {
      console.log('Photos database does not exist. Initializing');
      await db.collection('photos').insertOne({});
      console.log('Database initialized succesfully');
    }

    const collections = await db.listCollections().toArray();

    const photosCollectionExists = collections.find(c => c.name === 'photos');
    const devicesCollectionExists = collections.find(c => c.name === 'devices');

    if (!photosCollectionExists) {
      await db.createCollection('photos');
    }

    if (!devicesCollectionExists) {
      await db.createCollection('devices');
    }

    await mongoClient.close();

    const fixtures = new Fixtures({ dir: './src/database/mongo/fixtures' });

    await fixtures.connect(uri);
    await fixtures.unload();
    await fixtures.load();
    await fixtures.disconnect();

  } catch (err) {
    await mongoClient.close();

    throw err;
  }
}

let exitCode = 0;

init().then(() => {
  console.log('* Database initialized');
}).catch((err) => {
  exitCode = 1;
  console.error('Error initializing database: %s', err.message);
  console.log(err);
}).finally(() => {
  process.exit(exitCode);
});
