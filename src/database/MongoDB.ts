import { Collection, Db, MongoClient } from 'mongodb';

import { Database } from './Database';
import { DeviceDocument } from './mongo/models/Device';
import { PhotoDocument } from './mongo/models/Photo';
import { UserDocument } from './mongo/models/User';
import { ShareDocument } from './mongo/models/Share';

export interface MongoDBCollections {
  photos: Collection<PhotoDocument>,
  devices: Collection<DeviceDocument>,
  users: Collection<UserDocument>,
  shares: Collection<ShareDocument>,
};

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

    this.db = this.client.db(process.env.DATABASE_NAME);

    return this;
  }

  getCollections(): MongoDBCollections {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return {
      photos: this.db.collection<PhotoDocument>('photos'),
      devices: this.db.collection<DeviceDocument>('devices'),
      users: this.db.collection<UserDocument>('users'),
      shares: this.db.collection<ShareDocument>('shares'),
    };
  }

  disconnect(): Promise<void> {
    return this.client.close();
  }
}
