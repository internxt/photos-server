#!/usr/bin/env node

import { Command } from 'commander';
import { PhotosRepository } from '../../src/api/photos/repository';
import { PhotoId, PhotoStatus } from '../../src/models/Photo';
import { MongoDB } from '../../src/database/MongoDB';
import { DeleteFilesResponse, PhotoDeleter } from './PhotoDeleter';
import axios, { AxiosRequestConfig } from 'axios';
import { sign } from 'jsonwebtoken';
import { request } from '@internxt/lib';

type CommandOptions = {
  secret: string;
  dbUri: string;
  concurrency?: string;
  limit?: string;
  endpoint: string;
};

const commandsOptions: { flags: string; description: string; required: boolean }[] = [
  {
    flags: '-s, --secret <token_secret>',
    description: 'The secret used to sign the token to request files deletion',
    required: true,
  },
  {
    flags: '-d, --db-uri <database_uri>',
    description: 'The uri of the database where deleted photos are stored',
    required: true,
  },
  {
    flags: '-c, --concurrency <concurrency>',
    description: 'The concurrency level of the requests that will be made',
    required: false,
  },
  {
    flags: '-l, --limit <limit>',
    description: 'The files limit to handle each time',
    required: false,
  },
  {
    flags: '-e, --endpoint <endpoint>',
    description: 'The API endpoint where the delete files requests are sent',
    required: true,
  },
];

const command = new Command('delete-photos').version('0.0.1');

commandsOptions.forEach((c) => {
  if (c.required) {
    command.requiredOption(c.flags, c.description);
  } else {
    command.option(c.flags, c.description);
  }
});

command.parse();

const opts: CommandOptions = command.opts() as CommandOptions;

process.on('SIGINT', () => finishProgram());

const database = new MongoDB(opts.dbUri);

const token = sign(
  {}, 
  Buffer.from(opts.secret, 'base64').toString('utf8'), 
  {
    algorithm: 'RS256',
    expiresIn: '5m',
  }
);

async function deletePhotosFromStorage(ids: Array<PhotoId>) {
  try {
    const params: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: {
        files: ids,
      },
    };
    const res = await axios.delete<DeleteFilesResponse>(opts.endpoint, params);
    return res.data;
  } catch (err) {
    throw new Error(request.extractMessageFromError(err));
  }
}

async function initRepository() {
  await database.connect();

  const collections = database.getCollections();

  const photosCollection = collections.photos;

  const repository = new PhotosRepository(photosCollection);

  return {
    getPhotosIdsToDelete: async (limit: number) => {
      const fileIds: string[] = [];

      const photos = await repository.get(
        { status: PhotoStatus.Deleted }, 
        0, 
        limit
      );

      for (const photo of photos) {
        /* REMOVE PHOTO */
        fileIds.push(photo.fileId);
        if (photo.previewId) fileIds.push(photo.previewId);
        /* REMOVE PREVIEWS */
        if (photo.previews) {
          for (const preview of photo.previews) {
            if (preview.fileId) fileIds.push(preview.fileId);
          }
        }
      }
    
      return fileIds;
    },
    deletePhotosById: (ids: Array<PhotoId>) => {
      return photosCollection.deleteMany({ fileId: { $in: ids } });
    }
  };
}

async function finishProgram() {
  await database.disconnect();
}

const limit = parseInt(opts.limit || '20');
const concurrency = parseInt(opts.concurrency || '5');

initRepository()
  .then(
    ({ getPhotosIdsToDelete, deletePhotosById }) =>
      new PhotoDeleter(deletePhotosById, deletePhotosFromStorage, getPhotosIdsToDelete),
  )
  .then((deleter) => deleter.run(limit, concurrency))
  .catch(console.error)
  .finally(finishProgram);
