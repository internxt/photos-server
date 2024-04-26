export type UserId = string;
export type BucketId = string;
export type GalleryUsage = number;
export type TrashUsage = number;

export interface User {
  id: UserId;
  uuid: string;
  bucketId: BucketId;
  galleryUsage: GalleryUsage;
  trashUsage: TrashUsage;
  migrated?: boolean
}
