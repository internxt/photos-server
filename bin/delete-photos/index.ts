#!/usr/bin/env node

import { Command } from 'commander';
import { PhotosRepository } from '../../src/api/photos/repository';
import { PhotoId, PhotoStatus } from '../../src/models/Photo';
import { MongoDB } from '../../src/database/MongoDB';
import { CommandServices, DeleteFilesResponse } from './services';
import { PhotoDeleter } from './PhotoDeleter';
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
    flags: '--db-uri <database_uri>',
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

async function deletePhotoFromStorage(ids: Array<PhotoId>) {
//   const secret = [
// ].join('\n');
//   const token = sign({}, Buffer.from(secret, 'base64').toString('utf8'), {
//     algorithm: 'RS256',
//     expiresIn: '5m',
//   });

  const params: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.secret}`,
    },
    data: {
      files: ids,
    },
  };

  try {
    const res = await axios
      .delete<DeleteFilesResponse>(opts.endpoint, params);
    return res.data;
  } catch (err) {
    throw new Error(request.extractMessageFromError(err));
  }
}

async function services(): Promise<CommandServices> {
  await database.connect();

  const collections = database.getCollections();

  const photosCollection = collections.photos;

  const repository = new PhotosRepository(photosCollection);

  return {
    getPhotosIdsToDelete: async (limit: number) => {
      return await repository
        .get({ status: PhotoStatus.Deleted }, 0, limit)
        .then((photo) => photo.map((p) => p.fileId));
    },
    deletePhotosById: (ids: Array<PhotoId>) => {
      return photosCollection.deleteMany({ fileId: { $in: ids } });
    },
    deletePhotoFromStorage,
  };
}

async function finishProgram() {
  await database.disconnect();
}

const limit = parseInt(opts.limit || '20');
const concurrency = parseInt(opts.concurrency || '5');

services()
  .then(
    ({ getPhotosIdsToDelete, deletePhotosById, deletePhotoFromStorage }) =>
      new PhotoDeleter(deletePhotosById, deletePhotoFromStorage, getPhotosIdsToDelete),
  )
  .then((deleter) => deleter.run(limit, concurrency))
  .catch(console.error)
  .finally(finishProgram);
