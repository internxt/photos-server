import { Type, Static } from '@sinclair/typebox';

export const CreateShareSchema = Type.Object({
  encryptionKey: Type.String(),
  views: Type.Number(),
  token: Type.String(),
  photoId: Type.String(),
  bucket: Type.String(),
});

export const UpdateShareSchema = Type.Object({
  id: Type.String(),
  encryptionKey: Type.String(),
  views: Type.Number(),
  token: Type.String(),
  photoId: Type.String(),
  bucket: Type.String(),
});

export type CreateShareType = Static<typeof CreateShareSchema>;
export type UpdateShareType = Static<typeof UpdateShareSchema>;
