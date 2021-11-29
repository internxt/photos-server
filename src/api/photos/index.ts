import { FastifyRouter } from '../router';
import { PhotosController } from './controller';
import { CreatePhotoType, CreatePhotoSchema } from './schemas';

export const buildRouter = (controller: PhotosController): FastifyRouter => {
  return {
    handler: (server, opts, done) => {
      server.get('/:id', { preValidation: server.authenticate }, controller.getPhotoById.bind(controller));
      server.post<{ Body: CreatePhotoType }>(
        '/',
        {
          preValidation: server.authenticate,
          schema: {
            body: CreatePhotoSchema,
          },
        },
        controller.postPhoto.bind(controller),
      );
      server.delete('/:id', { preValidation: server.authenticate }, controller.deletePhotoById.bind(controller));

      done();
    },
    prefix: 'photos',
  };
};
