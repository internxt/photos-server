
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';

import { Device } from '../models/Device';
import { Photo } from '../models/Photo';

import { Database } from './Database';

export const collections: {
  photos?: Collection,
  devices?: Collection
} = {};

export interface PhotoDocument extends Photo {
  _id?: ObjectId
}

export interface DeviceDocument extends Device {
  _id?: ObjectId
}

export class MongoDB implements Database {
  private uri: string;
  private db: Db | null;

  constructor(uri: string) {
    this.uri = uri;
    this.db = null;
  }

  get URI() {
    return this.uri;
  }

  async connect(): Promise<MongoDB> {
    const client = new MongoClient(this.uri);

    await client.connect();

    this.db = client.db(process.env.DB_NAME);

    this.initializeCollections();

    return this;
  }

  initializeCollections() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const photosCollection: Collection = this.db.collection('photos');
    const devicesCollection: Collection = this.db.collection('devices');

    collections.devices = devicesCollection;
    collections.photos = photosCollection;
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
