import { Type, Static } from '@sinclair/typebox';

export const CreateShareSchema = Type.Object({
  encryptionKey: Type.String(),
  views: Type.Number(),
  photoId: Type.String(),
  bucket: Type.String(),
});

export const UpdateShareSchema = Type.Object({
  id: Type.String(),
  views: Type.Number(),
});

export type CreateShareType = Static<typeof CreateShareSchema>;
export type UpdateShareType = Static<typeof UpdateShareSchema>;
