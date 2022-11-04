import { DeleteResult } from 'mongodb';
import { PhotoId } from '../../src/models/Photo';

export type DeleteFilesResponse = {
  message: {
    confirmed: string[];
    notConfirmed: string[];
  };
};

type DeletePhotosById = (ids: Array<PhotoId>) => Promise<DeleteResult>;
type DeleteFileFromStorage = (id: Array<PhotoId>) => Promise<DeleteFilesResponse>;
type GetPhotosToDelete = (limit: number) => Promise<Array<PhotoId>>;

export type CommandServices = {
  deletePhotosById: DeletePhotosById;
  deletePhotoFromStorage: DeleteFileFromStorage;
  getPhotosIdsToDelete: GetPhotosToDelete;
};
