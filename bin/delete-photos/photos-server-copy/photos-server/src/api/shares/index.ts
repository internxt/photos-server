import { FastifyRouter } from '../router';
import { SharesController } from './controller';
import { CreateShareSchema, CreateShareType, UpdateShareSchema, UpdateShareType } from './schemas';

export const buildRouter = (controller: SharesController): FastifyRouter => {
  return {
    handler: (server, opts, done) => {
      server.get('/:id', controller.getShare.bind(controller));
      server.post<{ Body: CreateShareType }>(
        '/',
        {
          preValidation: server.authenticate,
          schema: {
            body: CreateShareSchema,
          },
        },
        controller.postShare.bind(controller),
      );
      server.patch<{ Body: UpdateShareType; Params: { id: string } }>(
        '/:id',
        {
          preValidation: server.authenticate,
          schema: {
            body: UpdateShareSchema,
          },
        },
        controller.patchShare.bind(controller),
      );

      done();
    },
    prefix: 'shares',
  };
};
