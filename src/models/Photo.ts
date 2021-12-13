import { DeviceId } from './Device';
import { UserId } from './User';

export type PhotoType = string;
export type FileId = string;
export type PhotoId = string;

export interface Photo {
  id: PhotoId;
  name: string;
  type: PhotoType;
  size: number;
  width: number;
  heigth: number;
  fileId: FileId;
  previewId: FileId;
  deviceId: DeviceId;
  userId: UserId;
}
