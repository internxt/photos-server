import { PhotoId } from '../../src/models/Photo';
import { CommandStatus } from './CommandStatus';
import { CommandServices, DeleteFilesResponse } from './services';

type PhotosIdChucks = Array<Array<PhotoId>>;

export async function setUp(initialization: () => Promise<CommandServices>) {
  const { getPhotosIdsToDelete, deletePhotoFromStorage, deletePhotosById } = await initialization();

  const status = new CommandStatus();

  return async (limit: number, concurrency: number) => {
    status.init();

    const chunksOf = Math.ceil(limit / concurrency);

    const deletePhotos = async (chuncks: PhotosIdChucks) => {
      console.time('df-network-req');
      const results = await Promise.allSettled(chuncks.map((chunk) => deletePhotoFromStorage(chunk)));
      console.timeEnd('df-network-req');

      status.updateRequest(results);

      const photosIdsRemoved = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => (r as PromiseFulfilledResult<DeleteFilesResponse>).value.message.confirmed);

      await deletePhotosById(photosIdsRemoved);

      status.updatePhotosRemoved(photosIdsRemoved);
    };

    let ids = await getPhotosIdsToDelete(limit);

    while (ids.length > 0) {
      const chuncks = Array.from(new Array(chunksOf), (_, i) =>
        ids.slice(i * concurrency, i * concurrency + concurrency),
      );

      await deletePhotos(chuncks);

      ids = await getPhotosIdsToDelete(limit);
    }

    status.clear();
  };
}
