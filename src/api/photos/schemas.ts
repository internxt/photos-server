import { Type, Static } from '@sinclair/typebox';

import { PhotoStatus } from '../../models/Photo';

export const CreatePhotoSchema = Type.Object({
  name: Type.String(),
  type: Type.String(),
  size: Type.Number(),
  width: Type.Number(),
  height: Type.Number(),
  fileId: Type.String(),
  previewId: Type.String(), // UNUSED
  deviceId: Type.String(),
  userId: Type.String(),
  previews: Type.Optional(
    Type.Array(Type.Object({
      width: Type.Number(),
      height: Type.Number(),
      size: Type.Number(),
      fileId: Type.String()
    }))
  ),
  takenAt: Type.Any(),
  hash: Type.String()
});

export const UpdatePhotoSchema = Type.Object({
  previews: Type.Optional(
    Type.Array(Type.Object({
      width: Type.Number(),
      height: Type.Number(),
      size: Type.Number(),
      fileId: Type.String()
    }))
  ),
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
export type UpdatePhotoType = Static<typeof UpdatePhotoSchema>;
export type GetPhotosQueryParamsType = Static<typeof GetPhotosQueryParamsSchema>;
