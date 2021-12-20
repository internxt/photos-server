import { Type, Static } from '@sinclair/typebox';

import { PhotoStatus } from '../../models/Photo';

export const CreatePhotoSchema = Type.Object({
  name: Type.String(),
  type: Type.String(),
  size: Type.Number(),
  width: Type.Number(),
  heigth: Type.Number(),
  fileId: Type.String(),
  previewId: Type.String(),
  deviceId: Type.String(),
  userId: Type.String()
});

export const GetPhotosQueryParamsSchema = Type.Object({
  from: Type.String(),
  limit: Type.Number(),
  skip: Type.Number(),
  status: Type.Enum(PhotoStatus)
});

export type CreatePhotoType = Static<typeof CreatePhotoSchema>;
export type GetPhotosQueryParamsType = Static<typeof GetPhotosQueryParamsSchema>;
