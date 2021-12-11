import { Type, Static } from '@sinclair/typebox';

export const InitUserSchema = Type.Object({
  mac: Type.String(),
  name: Type.String()
});

export type InitUserType = Static<typeof InitUserSchema>;
