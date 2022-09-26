import { FastifyRouter } from '../router';
import { PhotosController } from './controller';
import { CreatePhotoType, CreatePhotoSchema, GetPhotosQueryParamsSchema, CheckPhotosExistenceSchema } from './schemas';

export const buildRouter = (controller: PhotosController): FastifyRouter => {
  return {
    handler: (server, opts, done) => {
      server.get(
        '/', 
        { 
          preValidation: server.authenticate,
          schema: {
            querystring: GetPhotosQueryParamsSchema
          }
        }, 
        controller.getPhotos.bind(controller)
      );

      server.post(
        '/exists', 
        { 
          preValidation: server.authenticate,
          schema: { body: CheckPhotosExistenceSchema }
        }, 
        controller.photosExist.bind(controller)
      );

      server.get('/:id', { preValidation: server.authenticate }, controller.getPhotoById.bind(controller));
      server.get('/usage', { preValidation: server.authenticate }, controller.getUsage.bind(controller));
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
      server.post<{ Body: CreatePhotoType }>(
        '/maybe-existing-photo',
        {
          preValidation: server.authenticate,
          schema: {
            body: CreatePhotoSchema,
          },
        },
        controller.findOrCreatePhoto.bind(controller),
      );
      server.patch('/:id', { preValidation: server.authenticate }, controller.updatePhotoById.bind(controller));
      server.delete('/:id', { preValidation: server.authenticate }, controller.deletePhotoById.bind(controller));

      done();
    },
    prefix: 'photos',
  };
};
