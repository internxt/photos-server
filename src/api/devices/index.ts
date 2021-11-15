import { FastifyRouter } from '../router';
import { deleteDeviceById, getDeviceById, postDevice } from './controller';
import { CreateDeviceType, CreateDeviceSchema } from './schemas';

export const devicesRouter: FastifyRouter = {
  handler: (server, opts, done) => {
    server.get('/:id', getDeviceById);
    server.post<{ Body: CreateDeviceType }>('/', { schema: { body: CreateDeviceSchema } }, postDevice);
    server.delete('/:id', deleteDeviceById);

    done();
  },
  prefix: 'devices'
};
