import { DeleteResult } from 'mongodb';
import { PhotoId } from '../../src/models/Photo';
import { CommandStatus } from './CommandStatus';

export type DeletePhotosById = (ids: Array<PhotoId>) => Promise<DeleteResult>;
export type DeleteFileFromStorage = (id: Array<PhotoId>) => Promise<DeleteFilesResponse>;
export type GetPhotosToDelete = (limit: number) => Promise<Array<PhotoId>>;

type PhotosIdChucks = Array<Array<PhotoId>>;

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

  private async deletePhotos(chuncks: PhotosIdChucks) {
    console.time('df-network-req');
    const results = await Promise.allSettled(chuncks.map((chunk) => this.deletePhotoFromStorage(chunk)));
    console.timeEnd('df-network-req');

    this.status.updateRequest(results);

    const photosIdsRemoved = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => (r as PromiseFulfilledResult<DeleteFilesResponse>).value.message.confirmed);

    await this.deletePhotosById(photosIdsRemoved);

    this.status.updatePhotosRemoved(photosIdsRemoved);

    return photosIdsRemoved;
  }

  public async run(limit: number, concurrency: number) {
    this.status.init();
    try {
      const numberOfChunks = Math.ceil(limit / concurrency);

      let ids = await this.getPhotosIdsToDelete(limit);

      while (ids.length > 0) {
        const chuncks = Array.from(new Array(numberOfChunks), (_, i) =>
          ids.slice(i * concurrency, i * concurrency + concurrency),
        );

        await this.deletePhotos(chuncks);

        ids = await this.getPhotosIdsToDelete(limit);
      }
    } catch (err) {
      console.log(err);
    } finally {
      this.status.clear();
    }
  }
}
