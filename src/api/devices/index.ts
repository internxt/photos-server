import { FastifyRouter } from '../router';
import { DevicesController } from './controller';
import { CreateDeviceType, CreateDeviceSchema } from './schemas';

export const buildRouter = (controller: DevicesController): FastifyRouter => {
  return {
    handler: (server, opts, done) => {
      server.get('/:id', { preValidation: server.authenticate }, controller.getDeviceById);
      server.post<{ Body: CreateDeviceType }>(
        '/', 
        { 
          preValidation: server.authenticate, 
          schema: {
            body: CreateDeviceSchema 
          }
        }, 
        controller.postDevice
      );
      server.delete('/:id', { preValidation: server.authenticate }, controller.deleteDeviceById);
  
      done();
    },
    prefix: 'devices'
  };
};
