import { DeleteResult } from 'mongodb';
import { PhotoId } from '../../src/models/Photo';

export type DeleteFilesResponse = {
  message: {
    confirmed: string[];
    notConfirmed: string[];
  };
};

export type DeletePhotosById = (ids: Array<PhotoId>) => Promise<DeleteResult>;
export type DeleteFileFromStorage = (id: Array<PhotoId>) => Promise<DeleteFilesResponse>;
export type GetPhotosToDelete = (limit: number) => Promise<Array<PhotoId>>;

export type CommandServices = {
  deletePhotosById: DeletePhotosById;
  deletePhotoFromStorage: DeleteFileFromStorage;
  getPhotosIdsToDelete: GetPhotosToDelete;
};
