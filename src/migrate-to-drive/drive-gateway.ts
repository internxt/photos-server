/* eslint-disable max-len */
import { Client } from 'pg';
import { MongoDB } from '../database/MongoDB';
import { ObjectId } from 'mongodb';
import { User } from '../models/User';
import { Photo, PhotoStatus } from '../models/Photo';
import { v4 } from 'uuid';

export type PhotoWithTimes = Photo & { createdAt: Date, updatedAt: Date };

export class PhotosDatabase {
  private readonly db: MongoDB;
  
  constructor(uri: string) {
    this.db = new MongoDB(uri);
  }

  async connect(): Promise<void> {
    await this.db.connect();
  }

  async disconnect(): Promise<void> {
    await this.db.disconnect();
  }

  async* getUsersIterator(params: { lastId: string, pageSize: number }): AsyncGenerator<User> {
    let resultSize = 0;
    let lastId = new ObjectId(params.lastId);
    const { users } = this.db.getCollections();

    do {
      const results = await users.find({
        $and: [
          { migrated: false },
          { _id: { $gt: lastId } },
        ]
      })
        .sort({ _id: 1 })
        .limit(params.pageSize)
        .toArray();

      for (const user of results) {
        yield { ...user, id: user._id.toString() };
      }

      resultSize = results.length;

      if (resultSize > 0) {
        lastId = results[results.length - 1]._id;
      }
    } while (resultSize > 0 && resultSize % params.pageSize === 0);
  }

  async* getUserPhotosIterator(params: { 
    userId: string, 
    lastId: string,
    pageSize: number,
  }): AsyncGenerator<PhotoWithTimes[]> {
    let resultSize = 0;
    let lastId = new ObjectId(params.lastId);
    const userId = new ObjectId(params.userId);
    const { photos } = this.db.getCollections();

    while (resultSize % params.pageSize === 0) {
      const results = await photos.find({
        _id: {
          $gt: lastId
        },
        userId,
        status: {
          $ne: PhotoStatus.Deleted
        }
      })
        .sort({ _id: 1 })
        .limit(params.pageSize)
        .toArray();

      yield results.map((r) => {
        return { 
          ...r, 
          id: r._id.toString(), 
          userId: r.userId.toString(),
          deviceId: r.deviceId.toString(),
        };
      });

      resultSize = results.length;
      lastId = results[results.length - 1]._id;
    }
  }
}

export class DriveGateway {

}

export class NotFoundError extends Error {
  entityMetadata:  { name: string, id: number | string };

  constructor(entityMetadata: { name: string, id: number | string }) {
    super('Resource not found');

    this.entityMetadata = entityMetadata;

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  getExtendedInfo(): string {
    return JSON.stringify({ message: this.message, ...this.entityMetadata }, null, 2);
  }
}

export class DriveDatabase {
  private client: Client;

  URI: string;

  constructor() {
    this.URI = '';
    this.client = new Client({
      user: process.env.DRIVE_DB_USER,
      host: process.env.DRIVE_DB_HOST,
      database: process.env.DRIVE_DB_NAME,
      password: process.env.DRIVE_DB_PASS,
      port: parseInt(process.env.DRIVE_DB_PORT as string),
      ssl: {
        rejectUnauthorized: false,
      }
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  async getUserInfo(user: { uuid: string }): Promise<{ 
    rootFolderId: number, 
    rootFolderUuid: string, 
    id: number,
    username: string,
    bridgeUser: string,
    sharedWorkspace: boolean,
  } | null> {
    const query = `
      SELECT 
        u.root_folder_id AS root_folder_id,
        u.id AS id,
        f.uuid AS uuid,
        u.bridge_user as bridge_user,
        u.username as username,
        u.shared_workspace as shared_workspace
      FROM users u, folders f
      WHERE 
        u.uuid = '${user.uuid}' AND
        f.id = u.root_folder_id
    `;

    const { rows } = await this.client.query(query);
    const [rawUser, ...rest] = rows;
 
    return rawUser ? { 
      rootFolderId: parseInt(rawUser.root_folder_id), 
      rootFolderUuid: rawUser.uuid,
      id: parseInt(rawUser.id),
      username: rawUser.username,
      bridgeUser: rawUser.bridge_user,
      sharedWorkspace: rawUser.shared_workspace,
    } : null;
  }

  async createPhotosAsFiles(
    photosDriveFolderId: number,
    folderUuid: string,
    driveUserId: number, 
    photos: (PhotoWithTimes & { plainName: string })[],
    bucket: string,
  ): Promise<void> {
    await this.insertFiles(photos.map(p => {
      return {
        name: p.name,
        type: p.type,
        size: p.size,
        folderId: photosDriveFolderId,
        fileId: p.fileId,
        bucket,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        encryptVersion: '03-aes',
        deleted: p.status === PhotoStatus.Trashed,
        deletedAt: p.status === PhotoStatus.Trashed ? p.updatedAt : null,
        userId: driveUserId,
        modificationTime: p.statusChangedAt,
        plainName: p.plainName,
        uuid: v4(),
        folderUuid,
        status: p.status === PhotoStatus.Exists ? 'EXISTS' : 'TRASHED'
      };
    }));
  }

  async insertFiles(files: {
    name: string;
    type: string;
    size: number;
    folderId: number;
    fileId: string;
    bucket: string;
    createdAt: Date;
    updatedAt: Date;
    encryptVersion: string;
    deleted: boolean;
    deletedAt: Date | null;
    userId: number;
    modificationTime: Date;
    plainName: string;
    uuid: string;
    folderUuid: string;
    status: 'EXISTS' | 'TRASHED'
  }[]) {
    const ifExistQuery = `
      SELECT * FROM files WHERE file_id IN (${files.map((f) => {
        return "'" + f.fileId + "'";
      })})
    `;
    const { rows } = await this.client.query(ifExistQuery);

    const filesToInsert = files.filter(f => {
      return rows.findIndex(r => r.file_id === f.fileId) === -1;
    });

    if (filesToInsert.length === 0) { return; }

    const query = `
    INSERT INTO files (
      name, 
      type, 
      size, 
      folder_id, 
      file_id, 
      bucket, 
      created_at, 
      updated_at, 
      encrypt_version, 
      deleted, 
      deleted_at, 
      user_id, 
      modification_time, 
      plain_name, 
      uuid, 
      folder_uuid, 
      status
    )
    VALUES
    ${filesToInsert.map((f) => {
      return `(
        '${f.name}',
        '${f.type}',
        ${f.size},
        ${f.folderId},
        '${f.fileId}',
        '${f.bucket}',
        '${f.createdAt.toISOString()}',
        '${f.updatedAt.toISOString()}',
        '${f.encryptVersion}',
        ${f.deleted},
        ${f.deletedAt ? `'${f.deletedAt.toISOString()}'` : null},
        ${f.userId},
        '${f.modificationTime.toISOString()}',
        '${f.plainName}',
        '${f.uuid}',
        '${f.folderUuid}',
        '${f.status}'
      )`;
    })}`;

    await this.client.query(query);
  }

  async insertFolder(folder: {
    parentId: number;
    name: string;
    bucket: string;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
    encryptVersion: string;
    plainName: string;
    parentUuid: string;
  }): Promise<any> {
    const res = await this.client.query(
      `SELECT * 
      FROM folders 
      WHERE user_id = ${folder.userId} 
      AND parent_id = ${folder.parentId}
      AND (plain_name = '${folder.plainName}' OR name = '${folder.name}')
    `
    );

    if (res.rows.length > 0) {
      return res.rows[0];
    }
  
    const query = `
    INSERT INTO folders (
      parent_id,
      name,
      bucket,
      user_id,
      created_at,
      updated_at,
      encrypt_version,
      deleted,
      deleted_at,
      plain_name,
      parent_uuid,
      removed_at
    ) VALUES 
    (
      ${folder.parentId},
      '${folder.name}',
      null,
      ${folder.userId},
      '${folder.createdAt.toISOString()}',
      '${folder.updatedAt.toISOString()}',
      '${folder.encryptVersion}',
      false,
      null,
      '${folder.plainName}',
      '${folder.parentUuid}',
      null
    )
    RETURNING *
    `;

    const { rows } = await this.client.query(query);
    const [firstRow] = rows;
    
    return firstRow;
  }

  async insertThumbnails(thumbnails: {
    fileId: string;
    maxWidth: number;
    maxHeight: number;
    type: string;
    size: number;
    bucketId: string;
    bucketFile: string;
    encryptVersion: string;
    createdAt: Date;
    updatedAt: Date;
  }[]) {
    const query = `
    INSERT INTO thumbnails (
      file_id, 
      max_width, 
      max_height, 
      type, 
      size, 
      bucket_id, 
      bucket_file, 
      encrypt_version, 
      created_at, 
      updated_at
    )
    VALUES
    ${thumbnails.map((t) => {
      return `(${t.fileId},${t.maxWidth},${t.maxHeight},${t.type},${t.size},${t.bucketId},${t.bucketFile},${t.encryptVersion},${t.createdAt},${t.updatedAt})`;
    })}`;

    await this.client.query(query);
  }

  async insertNewFolderInsideRootFolder(folder: {
    id: number;
    parentId: number;
    name: string;
    bucket: string;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
    encryptVersion: string;
    deleted: boolean;
    deletedAt: Date;
    plainName: string;
    uuid: string;
    parentUuid: string;
    removed: boolean;
    removedAt: Date;
  }) {
    const query = `INSERT INTO folders (
      parent_id,
      name,
      bucket,
      user_id,
      created_at,
      updated_at,
      encrypt_version,
      deleted,
      deleted_at,
      plain_name,
      parent_uuid,
      removed_at
    ) VALUES (
      ${folder.parentId},
      ${folder.name},
      ${folder.bucket},
      ${folder.userId},
      ${folder.createdAt},
      ${folder.updatedAt},
      ${folder.encryptVersion},
      ${folder.deleted},
      ${folder.deletedAt},
      ${folder.plainName},
      ${folder.parentUuid},
      ${folder.removedAt}
    )`;

    await this.client.query(query);
  }
}
