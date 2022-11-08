import { PhotoId } from '../../src/models/Photo';
import { CommandStatus } from './CommandStatus';
import {
  DeleteFileFromStorage,
  DeleteFilesResponse,
  DeletePhotosById,
  GetPhotosToDelete,
} from './services';

type PhotosIdChucks = Array<Array<PhotoId>>;

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

    console.log(results);
    console.log('SOME REJECTEC', results.filter(result => result.status === 'rejected').length);

    const photosIdsRemoved = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => (r as PromiseFulfilledResult<DeleteFilesResponse>).value.message.confirmed);

    await this.deletePhotosById(photosIdsRemoved);

    this.status.updatePhotosRemoved(photosIdsRemoved);

    return photosIdsRemoved;
  };

  public async run(limit: number, concurrency: number) {
    this.status.init();
    try {
      const chunksOf = Math.ceil(limit / concurrency);

      let ids = await this.getPhotosIdsToDelete(limit);

      while (ids.length > 0) {
        const chuncks = Array.from(new Array(chunksOf), (_, i) =>
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