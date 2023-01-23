import { Type, Static } from '@sinclair/typebox';

import { PhotoPreviewType, PhotoStatus, PhotosItemType } from '../../models/Photo';

export const PhotoPreviewSchema = Type.Object({
  width: Type.Number(),
  height: Type.Number(),
  size: Type.Number(),
  fileId: Type.String(),
  type: Type.Enum(PhotoPreviewType),
});

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
  previews: Type.Optional(Type.Array(PhotoPreviewSchema)),
  takenAt: Type.Any(),
  hash: Type.String(),
  itemType: Type.Enum(PhotosItemType),
  duration: Type.Optional(Type.Number()),
  networkBucketId: Type.String(),
});

export const UpdatePhotoSchema = Type.Object({
  previews: Type.Optional(Type.Array(PhotoPreviewSchema)),
});

export const GetPhotosQueryParamsSchema = Type.Object({
  name: Type.Optional(Type.String()),
  status: Type.Optional(Type.Enum(PhotoStatus)),
  updatedAt: Type.Optional(Type.String()),
  deviceId: Type.Optional(Type.String()),
  limit: Type.Number(),
  skip: Type.Number(),
  includeDownloadLinks: Type.Optional(Type.Boolean()),
});

export const GetPhotosSortedQueryParamsSchema = Type.Object({
  status: Type.Optional(Type.Enum(PhotoStatus)),
  updatedAt: Type.Optional(Type.String()),
  sortBy: Type.String(),
  sortType: Type.String(),
  limit: Type.Number(),
  skip: Type.Number(),
  includeDownloadLinks: Type.Optional(Type.Boolean()),
});

const PhotoExistsSchema = Type.Object({
  hash: Type.String(),
  takenAt: Type.Any(),
  name: Type.String(),
});

export const CheckPhotosExistenceSchema = Type.Object({
  photos: Type.Array(PhotoExistsSchema),
});

export type CreatePhotoType = Static<typeof CreatePhotoSchema>;
export type UpdatePhotoType = Static<typeof UpdatePhotoSchema>;
export type GetPhotosQueryParamsType = Static<typeof GetPhotosQueryParamsSchema>;
export type GetPhotosSortedQueryParamsType = Static<typeof GetPhotosSortedQueryParamsSchema>;
export type CheckPhotosExistenceType = Static<typeof CheckPhotosExistenceSchema>;
