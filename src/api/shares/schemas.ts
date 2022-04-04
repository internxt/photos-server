import { Type, Static } from '@sinclair/typebox';

export const CreateShareSchema = Type.Object({
  encryptedMnemonic: Type.String(),
  views: Type.Number(),
  photoIds: Type.Array(Type.String()),
  bucket: Type.String(),
});

export const UpdateShareSchema = Type.Object({
  id: Type.String(),
  views: Type.Number(),
});

export type CreateShareType = Static<typeof CreateShareSchema>;
export type UpdateShareType = Static<typeof UpdateShareSchema>;
