#!/usr/bin/env node

import { Command } from 'commander';
import { PhotosRepository } from '../../src/api/photos/repository';
import { PhotoId, PhotoStatus } from '../../src/models/Photo';
import { MongoDB } from '../../src/database/MongoDB';
import { CommandServices, DeleteFilesResponse } from './services';
import { setUp } from './setup';

type CommandOptions = {
  secret: string;
  dbHostname: string;
  dbPort: string;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
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
    flags: '--db-hostname <database_hostname>',
    description: 'The hostname of the database where deleted files are stored',
    required: true,
  },
  {
    flags: '--db-name <database_name>',
    description: 'The name of the database where deleted files are stored',
    required: true,
  },
  {
    flags: '--db-username <database_username>',
    description: 'The username authorized to read and delete from the deleted files table',
    required: true,
  },
  {
    flags: '--db-password <database_password>',
    description: 'The database username password',
    required: true,
  },
  {
    flags: '--db-port <database_port>',
    description: 'The database port',
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

if (!process.env.DATABASE_URI) {
  process.exit(1);
}
const database = new MongoDB(process.env.DATABASE_URI);

async function services(): Promise<CommandServices> {
  await database.connect();

  const collections = database.getCollections();

  const photosCollection = collections.photos;

  const repository = new PhotosRepository(photosCollection);

  return {
    getPhotosIdsToDelete: async (limit: number) => {
      return repository.get({ status: PhotoStatus.Deleted }, limit).then((photo) => photo.map((p) => p.id));
    },
    deletePhotoFromStorage: (ids: Array<PhotoId>) => {
      return Promise.resolve({
        message: {
          confirmed: ids,
          notConfirmed: [],
        },
      });
    },
    deletePhotosById: (ids: Array<PhotoId>) => photosCollection.deleteMany({ fileId: { $in: ids } }),
  };
}

async function finishProgram() {
  await database.disconnect();
}

const limit = parseInt(opts.limit || '20');
const concurrency = parseInt(opts.concurrency || '5');

setUp(services)
  .then((fn) => fn(limit, concurrency))
  .catch(console.error)
  .finally(finishProgram);
