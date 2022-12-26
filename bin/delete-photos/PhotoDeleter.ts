import { DeleteResult } from 'mongodb';
import { PhotoId } from '../../src/models/Photo';
import { CommandStatus } from './CommandStatus';

export type DeletePhotosById = (ids: Array<PhotoId>) => Promise<DeleteResult>;
export type DeleteFileFromStorage = (id: Array<PhotoId>) => Promise<DeleteFilesResponse>;
export type GetPhotosToDelete = (limit: number) => Promise<Array<PhotoId>>;

export type DeleteFilesResponse = {
  message: {
    confirmed: string[];
    notConfirmed: string[];
  };
};

export class PhotoDeleter {
  private readonly status: CommandStatus;

  constructor(
    private readonly deletePhotosById: DeletePhotosById,
    private readonly deletePhotoFromStorage: DeleteFileFromStorage,
    private readonly getPhotosIdsToDelete: GetPhotosToDelete,
  ) {
    this.status = new CommandStatus();
  }

  private async deletePhotos(ids: PhotoId[]) {
    console.time('df-network-req');
    const { message: { confirmed: photosIdsRemoved } } = await this.deletePhotoFromStorage(ids);
    console.timeEnd('df-network-req');

    // this.status.updateRequest(results);

    await this.deletePhotosById(photosIdsRemoved);

    this.status.updatePhotosRemoved(photosIdsRemoved);

    return photosIdsRemoved;
  }

  public async run(limit: number) {
    this.status.init();

    let ids = await this.getPhotosIdsToDelete(limit);

    while (ids.length > 0) {
      await this.deletePhotos(ids);

      ids = await this.getPhotosIdsToDelete(limit);
    }
  }
}
