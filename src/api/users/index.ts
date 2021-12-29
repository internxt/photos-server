import { FastifyRouter } from '../router';
import { UsersController } from './controller';
import { InitUserSchema } from './schemas';

export const buildRouter = (controller: UsersController): FastifyRouter => {
  return {
    handler: (server, opts, done) => {
      server.post('/', {
        preValidation: server.authenticate,
        schema: {
          body: InitUserSchema,
        },
      }, controller.postUser.bind(controller));

      done();
    },
    prefix: 'users',
  };
};
