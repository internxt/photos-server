import { PhotoId } from './Photo';
import { BucketId } from './User';

export type PhotoType = string;
export type ShareId = string;

export interface Share {
  id: ShareId;
  encryptionKey: string;
  token: string;
  photoId: PhotoId;
  bucket: BucketId;
  views: number;
}
