import { Type, Static } from '@sinclair/typebox';
import { MAX_PHOTOS_IN_SHARE } from '../../models/Share';

export const CreateShareSchema = Type.Object({
  encryptedMnemonic: Type.String(),
  views: Type.Number(),
  photoIds: Type.Array(Type.String(), { maxItems: MAX_PHOTOS_IN_SHARE, minItems: 1 }),
  bucket: Type.String(),
  token: Type.String(),
});

export const UpdateShareSchema = Type.Object({
  views: Type.Number({ minimum: 0 }),
});

export type CreateShareType = Static<typeof CreateShareSchema>;
export type UpdateShareType = Static<typeof UpdateShareSchema>;
