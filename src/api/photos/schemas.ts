import { Type, Static } from '@sinclair/typebox';

import { PhotoStatus } from '../../models/Photo';

export const CreatePhotoSchema = Type.Object({
  name: Type.String(),
  type: Type.String(),
  size: Type.Number(),
  width: Type.Number(),
  height: Type.Number(),
  fileId: Type.String(),
  previewId: Type.String(),
  deviceId: Type.String(),
  userId: Type.String(),
  // TODO: Use ajv validation to force the format of a date on type String
  takenAt: Type.Any(),
  hash: Type.String()
});

export const GetPhotosQueryParamsSchema = Type.Object({
  name: Type.Optional(Type.String()),
  status: Type.Optional(Type.Enum(PhotoStatus)),
  statusChangedAt: Type.Optional(Type.String()),
  deviceId: Type.Optional(Type.String()),
  limit: Type.Number(),
  skip: Type.Number(),
});

export type CreatePhotoType = Static<typeof CreatePhotoSchema>;
export type GetPhotosQueryParamsType = Static<typeof GetPhotosQueryParamsSchema>;
