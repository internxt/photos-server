import { Type, Static } from '@sinclair/typebox';

export const CreateDeviceSchema = Type.Object({
  mac: Type.String(),
  name: Type.String(),
  userId: Type.String(),
});

export const GetDevicesQueryParamsSchema = Type.Object({});

export type CreateDeviceType = Static<typeof CreateDeviceSchema>;
export type GetDevicesQueryParamsType = Static<typeof GetDevicesQueryParamsSchema>;
