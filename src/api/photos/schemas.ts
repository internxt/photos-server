import { Type, Static } from '@sinclair/typebox';

export const CreatePhotoSchema = Type.Object({
  name: Type.String(),
  type: Type.String(),
  size: Type.Number(),
  width: Type.Number(),
  heigth: Type.Number(),
  fileId: Type.String(),
  previewId: Type.String(),
  deviceId: Type.String(),
  userUuid: Type.String()
});

export type CreatePhotoType = Static<typeof CreatePhotoSchema>;
