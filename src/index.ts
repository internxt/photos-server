import Fastify, { FastifyInstance } from 'fastify';
import { Collection } from 'mongodb';
import { config } from 'dotenv';

import decorateWithAuth from './middleware/auth/jwt';
import { Database } from './database/Database';
import { MongoDB } from './database/MongoDB';
import { buildRouter as buildDevicesRouter } from './api/devices';
import { buildRouter as buildPhotosRouter } from './api/photos';
import { buildRouter as buildSharesRouter } from './api/shares';
import { PhotosController } from './api/photos/controller';
import { PhotosUsecase } from './api/photos/usecase';
import { PhotosRepository } from './api/photos/repository';
import { FastifyRouter } from './api/router';
import { DevicesController } from './api/devices/controller';
import { DevicesUsecase } from './api/devices/usecase';
import { DevicesRepository } from './api/devices/repository';
import { PhotoDocument } from './database/mongo/models/Photo';
import { DeviceDocument } from './database/mongo/models/Device';
import { ShareDocument } from './database/mongo/models/Share';
import { SharesRepository } from './api/shares/repository';
import { SharesUsecase } from './api/shares/usecase';
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

function getPhotosRouter(photosCollection: Collection<PhotoDocument>): FastifyRouter {
  const photosRepository = new PhotosRepository(photosCollection);
  const photosUsecase = new PhotosUsecase(photosRepository);
  const photosController = new PhotosController(photosUsecase);

  return buildPhotosRouter(photosController);
}

function getDevicesRouter(devicesCollection: Collection<DeviceDocument>): FastifyRouter {
  const devicesRepository = new DevicesRepository(devicesCollection);
  const devicesUsecase = new DevicesUsecase(devicesRepository);
  const devicesController = new DevicesController(devicesUsecase);

  return buildDevicesRouter(devicesController);
}

function getSharesRouter(
  sharesCollection: Collection<ShareDocument>,
  photosCollection: Collection<PhotoDocument>
): FastifyRouter {
  const sharesRepository = new SharesRepository(sharesCollection);
  const photosRepository = new PhotosRepository(photosCollection);
  const sharesUsecase = new SharesUsecase(sharesRepository, photosRepository);
  const sharesController = new SharesController(sharesUsecase);

  return buildSharesRouter(sharesController);
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

  if (
    !process.env.DATABASE_URI &&
    (!process.env.DATABASE_HOST || !process.env.DATABASE_PORT || !process.env.DATABASE_NAME)
  ) {
    fastify.log.error('Missing env vars');
    process.exit(1);
  }

  const database = new MongoDB(
    process.env.DATABASE_URI ??
      MongoDB.buildURI(
        process.env.DATABASE_HOST as string,
        parseInt(process.env.DATABASE_PORT as string),
        process.env.DATABASE_NAME as string,
      ),
  );

  await database.connect();
  const collections = database.getCollections();

  const photosRouter = getPhotosRouter(collections.photos);
  const devicesRouter = getDevicesRouter(collections.devices);
  const sharesRouter = getSharesRouter(collections.shares, collections.photos);

  await decorateWithAuth(fastify, {});

  fastify.register(devicesRouter.handler, { prefix: devicesRouter.prefix });
  fastify.register(photosRouter.handler, { prefix: photosRouter.prefix });
  fastify.register(sharesRouter.handler, { prefix: sharesRouter.prefix });
  fastify.log.info('Connected to database');

  await fastify.listen(config.port || 8000, '0.0.0.0');

  return generateStopHandler(fastify, database);
}

export default start;
