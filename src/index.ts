import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from 'fastify-cors';
import { config } from 'dotenv';

import decorateWithAuth from './middleware/auth/jwt';

import { buildRouter as buildDevicesRouter } from './api/devices';
import { buildRouter as buildPhotosRouter } from './api/photos';
import { buildRouter as buildSharesRouter } from './api/shares';
import { buildRouter as buildUsersRouter } from './api/users';

import { Database } from './database/Database';
import { MongoDB, MongoDBCollections } from './database/MongoDB';

import { PhotosController } from './api/photos/controller';
import { PhotosUsecase } from './api/photos/usecase';
import { PhotosRepository } from './api/photos/repository';
import { DevicesController } from './api/devices/controller';
import { DevicesUsecase } from './api/devices/usecase';
import { DevicesRepository } from './api/devices/repository';
import { UsersRepository } from './api/users/repository';
import { UsersUsecase } from './api/users/usecase';
import { SharesRepository } from './api/shares/repository';
import { SharesUsecase } from './api/shares/usecase';
import { UsersController } from './api/users/controller';
import { SharesController } from './api/shares/controller';

config();

interface ServerConfig {
  logger: {
    level?: string;
    enabled: boolean;
  };
  port?: number;
}

export interface StopManager {
  stop: () => Promise<void>;
  serverInstance: FastifyInstance;
  dbInstance: Database;
}

async function initHTTPServer(collections: MongoDBCollections, fastify: FastifyInstance) {
  const devicesRepository = new DevicesRepository(collections.devices);
  const usersRepository = new UsersRepository(collections.users);
  const photosRepository = new PhotosRepository(collections.photos);
  const sharesRepository = new SharesRepository(collections.shares);

  const devicesUsecase = new DevicesUsecase(devicesRepository, usersRepository);
  const usersUsecase = new UsersUsecase(usersRepository, devicesRepository);
  const photosUsecase = new PhotosUsecase(photosRepository, usersRepository);
  const sharesUsecase = new SharesUsecase(sharesRepository, photosRepository);

  const devicesController = new DevicesController(devicesUsecase, usersUsecase);
  const usersController = new UsersController(usersUsecase);
  const photosController = new PhotosController(photosUsecase, usersUsecase, devicesUsecase);
  const sharesController = new SharesController(sharesUsecase);

  const devicesRouter = buildDevicesRouter(devicesController);
  const photosRouter = buildPhotosRouter(photosController);
  const sharesRouter = buildSharesRouter(sharesController);
  const usersRouter = buildUsersRouter(usersController);

  await decorateWithAuth(fastify, {});

  const API_PREFIX = 'api/';
  fastify.register(devicesRouter.handler, { prefix: API_PREFIX + devicesRouter.prefix });
  fastify.register(photosRouter.handler, { prefix: API_PREFIX + photosRouter.prefix });
  fastify.register(sharesRouter.handler, { prefix: API_PREFIX + sharesRouter.prefix });
  fastify.register(usersRouter.handler, { prefix: API_PREFIX + usersRouter.prefix });
}

function generateStopHandler(fastify: FastifyInstance, db: Database): StopManager {
  return {
    stop: async () => {
      await db.disconnect();
      await fastify.close();
    },
    serverInstance: fastify,
    dbInstance: db,
  };
}

async function start(config: ServerConfig): Promise<StopManager> {
  let fastify: FastifyInstance;

  if (config.logger.level) {
    fastify = Fastify({
      logger: {
        level: config.logger.level,
      },
    });
  } else {
    fastify = Fastify({ logger: config.logger.enabled });
  }

  fastify.register(fastifyCors, {
    allowedHeaders: [
      'sessionId',
      'Content-Type',
      'Authorization',
      'method',
      'internxt-version',
      'internxt-client',
      'internxt-mnemonic',
    ],
    exposedHeaders: ['sessionId'],
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
  });

  if (!process.env.DATABASE_URI || !process.env.DATABASE_NAME) {
    fastify.log.error('Missing env vars');
    process.exit(1);
  }

  const database = new MongoDB(process.env.DATABASE_URI);

  await database.connect();
  fastify.log.info('Connected to database');

  await initHTTPServer(database.getCollections(), fastify);
  await fastify.listen(config.port || 8000, '0.0.0.0');

  return generateStopHandler(fastify, database);
}

export default start;
