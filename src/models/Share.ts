import { PhotoId } from './Photo';
import { BucketId } from './User';

export type PhotoType = string;
export type ShareId = string;

export const MAX_PHOTOS_IN_SHARE = 100;

export interface Share {
  id: ShareId;
  encryptedMnemonic: string;
  token: string;
  photoIds: PhotoId[];
  bucket: BucketId;
  views: number;
}
