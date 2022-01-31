import { DeviceId } from './Device';
import { UserId } from './User';

export type PhotoType = string;
export type FileId = string;
export type PhotoId = string;

export enum PhotoStatus {
  Exists = 'EXISTS',
  Trashed = 'TRASHED',
  Deleted = 'DELETED'
}

export interface Photo {
  id: PhotoId
  name: string
  type: PhotoType
  size: number
  width: number
  height: number
  fileId: FileId
  previewId: FileId
  deviceId: DeviceId
  userId: UserId
  status: PhotoStatus
  hash: string;
  statusChangedAt: Date
  takenAt: Date
}

export type NewPhoto = Omit<Photo, 'id' | 'statusChangedAt' | 'status'>;
