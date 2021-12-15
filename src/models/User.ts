export type UserId = string;
export type BucketId = string;

export interface User {
  id: UserId;
  uuid: string
  bucketId: BucketId
}
