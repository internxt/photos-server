import { FastifyRouter } from '../router';
import { PhotosController } from './controller';
import { 
  CreatePhotoType, 
  CreatePhotoSchema, 
  GetPhotosQueryParamsSchema, 
  CheckPhotosExistenceSchema, 
  GetPhotosSortedQueryParamsSchema, 
  DeletePhotosSchema,
  TrashPhotosSchema
} from './schemas';

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

      server.get(
        '/sorted', 
        { 
          preValidation: server.authenticate,
          schema: {
            querystring: GetPhotosSortedQueryParamsSchema
          }
        }, 
        controller.getPhotosSorted.bind(controller)
      );

      server.get('/count', { preValidation: server.authenticate }, controller.getPhotosCounts.bind(controller));

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
        '/photo/exists',
        {
          preValidation: server.authenticate,
          schema: {
            body: CreatePhotoSchema,
          },
        },
        controller.findOrCreatePhoto.bind(controller),
      );
      server.patch('/:id', { preValidation: server.authenticate }, controller.updatePhotoById.bind(controller));
      server.delete('/photos', { preValidation: server.authenticate, schema: {
        body: DeletePhotosSchema
      } }, controller.deletePhotosById.bind(controller));
      // Should be deprecated, use DELETE /photos instead for bulk update
      server.delete('/:id', { preValidation: server.authenticate }, controller.deletePhotoById.bind(controller));
      server.post('/photos/trash', { preValidation: server.authenticate, schema: {
        body: TrashPhotosSchema
      } }, controller.trashPhotosById.bind(controller));
      // Should be deprecated, use POST /photos/trash instead for bulk update
      server.post('/:id/trash', { preValidation: server.authenticate }, controller.trashPhotoById.bind(controller));
      done();
    },
    prefix: 'photos',
  };
};
