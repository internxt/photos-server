import fp from 'fastify-plugin';
import jwt from 'fastify-jwt';
import { FastifyReply, FastifyRequest } from 'fastify';

export interface AuthorizedUser {
  payload: {
    uuid: string;
  }
}

export default fp(async function(fastify) {
  fastify.register(jwt, {
    secret: process.env.SERVER_AUTH_SECRET || 'abcdefg12345'
  });

  fastify.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
});
