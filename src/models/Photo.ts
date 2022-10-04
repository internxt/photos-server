import { DeviceId } from './Device';
import { UserId } from './User';

export type PhotoType = string;
export type FileId = string;
export type PhotoId = string;

export enum PhotoStatus {
  Exists = 'EXISTS',
  Trashed = 'TRASHED',
  Deleted = 'DELETED',
}

export interface Photo {
  id: PhotoId;
  name: string;
  type: PhotoType;
  size: number;
  width: number;
  height: number;
  fileId: FileId;
  previewId: FileId;
  previews?: { width: number; height: number; size: number; fileId: FileId; type: PhotoPreviewType }[];
  deviceId: DeviceId;
  userId: UserId;
  status: PhotoStatus;
  hash: string;
  statusChangedAt: Date;
  takenAt: Date;
  duration?: number;
  itemType: PhotosItemType;
}

export type NewPhoto = Omit<Photo, 'id' | 'statusChangedAt' | 'status'> & { networkBucketId: string };

export enum PhotoPreviewType {
  PNG = 'PNG',
  JPEG = 'JPEG',
}

export enum PhotosItemType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

export const DEFAULT_PHOTO_PREVIEW_TYPE = PhotoPreviewType.JPEG;
