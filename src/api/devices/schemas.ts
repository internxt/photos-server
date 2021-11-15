import { Type, Static } from '@sinclair/typebox';

export const CreateDeviceSchema = Type.Object({
  mac: Type.String(),
  name: Type.String()
});

export type CreateDeviceType = Static<typeof CreateDeviceSchema>;
