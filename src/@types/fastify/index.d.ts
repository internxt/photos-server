/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import fastify from 'fastify';
import { ServerResponse, IncomingMessage, Server } from 'http';

/**
 * Used only for providing autocomplete to the auth decorator
 */
declare module 'fastify' {
  export interface FastifyInstance<
    HttpServer = Server,
    HttpRequest = IncomingMessage,
    HttpResponse = ServerResponse
  > {
    authenticate(): any;
    jwt: {
      sign: (params: { payload: any }) => string
    }
    // someOtherDecorator() => void..
  }
}