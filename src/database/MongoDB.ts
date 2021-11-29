import { Collection, Db, MongoClient } from 'mongodb';

import { Database } from './Database';
import { DeviceDocument } from './mongo/models/Device';
import { PhotoDocument } from './mongo/models/Photo';

export const collections: {
  photos?: Collection;
  devices?: Collection;
} = {};

export class MongoDB implements Database {
  private uri: string;
  private db: Db | null;
  private client: MongoClient;

  constructor(uri: string) {
    this.uri = uri;
    this.db = null;
    this.client = new MongoClient(this.uri);
  }

  static buildURI(host: string, port: number, dbName: string) {
    return `mongodb://${host}:${port}/${dbName}`;
  }

  get URI() {
    return this.uri;
  }

  async connect(): Promise<MongoDB> {
    await this.client.connect();

    this.db = this.client.db(process.env.DB_NAME);

    return this;
  }

  getCollections() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return {
      photos: this.db.collection<PhotoDocument>('photos'),
      devices: this.db.collection<DeviceDocument>('devices'),
    };
  }

  disconnect(): Promise<void> {
    return this.client.close();
  }
}
