import axios from 'axios';

import startServer, { StopManager } from '../../../../src';
import { Device, DeviceId } from '../../../../src/models/Device';

const deviceForTesting: Device = {
  id: '',
  mac: 'aaaa',
  name: 'eeee'
};

let stopManager: StopManager;

beforeAll((ready) => {
  startServer({ logger: { enabled: false }}).then((manager) => {
    stopManager = manager;

    return createDevice(deviceForTesting);
  }).then((id: DeviceId) => {
    deviceForTesting.id = id;
    ready();
  }).catch((err) => {
    ready(err);
  });
});

afterAll((finish) => {
  deleteDevice(deviceForTesting.id).then(() => {
    return stopManager.stop();
  }).then(() => {
    finish();
  }).catch((err) => {
    finish(err);
  });
});

function getDevice(deviceId: string): Promise<Device> {
  return axios.get('http://localhost:' + process.env.SERVER_PORT + '/devices/' + deviceId)
    .then((res) =>  {
      delete res.data.createdAt;
      delete res.data.updatedAt;

      return res.data as Device;
    });
}

function createDevice(deviceCreationAttributes: Omit<Device, 'id'>): Promise<DeviceId> {
  return axios.post('http://localhost:' + process.env.SERVER_PORT + '/devices', deviceCreationAttributes)
    .then((res) => res.data.id as DeviceId);
}

function deleteDevice(id: DeviceId): Promise<string> {
  return axios.delete('http://localhost:' + process.env.SERVER_PORT + '/devices/' + id)
    .then((res) => res.data.message as string);
}

describe('# e2e tests', () => {
  describe('Devices', () => {
    describe('POST /devices', () => {
      it('Should create a device properly', async () => {
        const mac = 'fakeMac';
        const name = 'fakeName';

        const deviceId = await createDevice({ mac, name });
        const received = await getDevice(deviceId);
        const expected: Device = { id: deviceId, mac, name };

        expect(deviceId).toBeTruthy();
        expect(received).toStrictEqual(expected);
      });
    });
    describe('GET /devices/:id', () => {
      it('Should retrieve a device properly', async () => {
        const received = await getDevice(deviceForTesting.id);
        const expected = deviceForTesting;

        expect(received).toStrictEqual(expected);
      });
    });
    describe('DELETE /devices/:id', () => {
      it('Should delete a device properly', async () => {
        await deleteDevice(deviceForTesting.id);

        expect(getDevice(deviceForTesting.id)).rejects.toEqual(new Error('Request failed with status code 404'));
      });
    });
  });
});
