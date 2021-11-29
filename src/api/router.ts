import { FastifyInstance, FastifyLoggerInstance, FastifyRegisterOptions } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';

export interface Router {
  handler: unknown;
  prefix: string;
}

export interface FastifyRouter extends Router {
  handler: (
    server: FastifyInstance<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>,
    opts: FastifyRegisterOptions<{ prefix: string }>,
    done: (err?: Error | undefined) => void,
  ) => void;
}
