import Fastify, { FastifyInstance } from 'fastify';
import { config } from 'dotenv';

import { devicesRouter } from './api/devices';
import { Database } from './database/Database';
import { MongoDB } from './database/MongoDB';

config();

interface ServerConfig {
  logger: {
    level?: string,
    enabled: boolean
  }
}

export interface StopManager {
  stop: () => Promise<void>
  serverInstance: FastifyInstance
  dbInstance: Database
}

function generateStopHandler(fastify: FastifyInstance, db: Database): StopManager {
  return {
    stop: async () => {
      await db.disconnect();
      await fastify.close();
    },
    serverInstance: fastify,
    dbInstance: db
  };
}

async function start(config: ServerConfig): Promise<StopManager> {
  let fastify: FastifyInstance;

  if (config.logger.level) {
    fastify = Fastify({ logger: {
      level: config.logger.level
    }});
  } else {
    fastify = Fastify({ logger: config.logger.enabled });
  }

  fastify.register(devicesRouter.handler, { prefix: devicesRouter.prefix });

  if (
    !process.env.DATABASE_URI && (
      !process.env.DATABASE_HOST || 
      !process.env.DATABASE_PORT || 
      !process.env.DATABASE_NAME
    )
  ) {
    fastify.log.error('Missing env vars');
    process.exit(1);
  }
  
  const database: Database = new MongoDB(
    (process.env.DATABASE_URI ?? MongoDB.buildURI(
      process.env.DATABASE_HOST as string, 
      parseInt(process.env.DATABASE_PORT as string), 
      process.env.DATABASE_NAME as string
    ))
  );

  await database.connect();

  fastify.log.info('Connected to database');

  await fastify.listen(process.env.SERVER_PORT || 8000);

  return generateStopHandler(fastify, database);
}


export default start;