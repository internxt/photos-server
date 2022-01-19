import { FastifyRouter } from '../router';
import { DevicesController } from './controller';
import { CreateDeviceType, CreateDeviceSchema, GetDevicesQueryParamsSchema } from './schemas';

export const buildRouter = (controller: DevicesController): FastifyRouter => {
  return {
    handler: (server, opts, done) => {
      server.get('/', { 
        preValidation: server.authenticate,
        schema: {
          querystring: GetDevicesQueryParamsSchema
        }
      }, 
      controller.getDevices.bind(controller)
    );
      server.get('/:id', { preValidation: server.authenticate }, controller.getDeviceById.bind(controller));
      server.post<{ Body: CreateDeviceType }>(
        '/',
        {
          preValidation: server.authenticate,
          schema: {
            body: CreateDeviceSchema,
          },
        },
        controller.postDevice.bind(controller),
      );
      server.delete('/:id', { preValidation: server.authenticate }, controller.deleteDeviceById.bind(controller));

      done();
    },
    prefix: 'devices',
  };
};
