import { PhotoDeleter } from './PhotoDeleter';

function retrivesNeeded(retriveCallsToObtainAll: number, value: any): jest.Mock {
  const mock = jest.fn();

  for (let i = 0; i < retriveCallsToObtainAll; i++) {
    mock.mockResolvedValueOnce(value);
  }

  mock.mockResolvedValueOnce([]);

  return mock;
}

describe('Delete photos', () => {
  it('deletes 20 photos in chuks of 2', async () => {
    const limit = 20;

    const id = '12d1e28f-f69b-5251-837a-bf29ed871b97';
    const ids = Array(limit).fill(id);

    const getPhotosIdsToDelete = retrivesNeeded(1, ids);

    const deletePhotoFromStorage = jest.fn().mockResolvedValue({
      message: {
        confirmed: [ids],
        notConfirmed: [],
      },
    });

    const deletePhotosById = jest.fn();

    const deleter = new PhotoDeleter(deletePhotosById, deletePhotoFromStorage, getPhotosIdsToDelete);

    await deleter.run(limit);

    expect(getPhotosIdsToDelete).toBeCalledTimes(2);
    expect(deletePhotoFromStorage).toBeCalledTimes(2);
    expect(deletePhotoFromStorage).toBeCalledWith(Array(10).fill(id));
    expect(deletePhotosById).toBeCalledTimes(1);
  });

  it('deletes 15 photos in chunks of 2', async () => {
    const limit = 20;
    const concurrency = 10;

    const id = '12d1e28f-f69b-5251-837a-bf29ed871b97';
    const ids = Array(15).fill(id);

    const getPhotosIdsToDelete = jest.fn().mockResolvedValueOnce(ids).mockResolvedValueOnce([]);

    const deletePhotoFromStorage = jest.fn().mockResolvedValue({
      message: {
        confirmed: [ids],
        notConfirmed: [],
      },
    });

    const deletePhotosById = jest.fn();

    const deleter = new PhotoDeleter(deletePhotosById, deletePhotoFromStorage, getPhotosIdsToDelete);

    await deleter.run(limit);

    expect(getPhotosIdsToDelete).toBeCalledTimes(2);
    expect(deletePhotoFromStorage).toBeCalledTimes(2);
    expect(deletePhotoFromStorage.mock.calls).toEqual([[Array(10).fill(id)], [Array(5).fill(id)]]);
    expect(deletePhotosById).toBeCalledTimes(1);
  });

  it('retrieves all photos when ther are more than the retrive limit', async () => {
    const limit = 5;
    const retriveCallsToObtainAll = 4;
    const id = '12d1e28f-f69b-5251-837a-bf29ed871b97';
    const ids = Array(limit).fill(id);

    const getPhotosIdsToDelete = retrivesNeeded(retriveCallsToObtainAll, ids);

    const deletePhotoFromStorage = jest.fn().mockResolvedValue({
      message: {
        confirmed: [ids],
        notConfirmed: [],
      },
    });

    const deletePhotosById = jest.fn();

    const deleter = new PhotoDeleter(deletePhotosById, deletePhotoFromStorage, getPhotosIdsToDelete);

    await deleter.run(limit);

    expect(getPhotosIdsToDelete).toBeCalledTimes(retriveCallsToObtainAll + 1);
    expect(deletePhotoFromStorage).toBeCalledTimes(retriveCallsToObtainAll * limit);
    expect(deletePhotosById).toBeCalledTimes(retriveCallsToObtainAll);
  });

  it('deletes only the files that have beed correctly deleted from the network', async () => {
    const limit = 20;
    const retriveCallsToObtainAll = 2;
    const id = '12d1e28f-f69b-5251-837a-bf29ed871b97';
    const ids = Array(limit).fill(id);
    const deletedSuccesfully = Array(limit - 6).fill(id);

    const getPhotosIdsToDelete = retrivesNeeded(retriveCallsToObtainAll, ids);

    const deletePhotoFromStorage = jest.fn().mockResolvedValue({
      message: {
        confirmed: [deletedSuccesfully],
        notConfirmed: [id],
      },
    });

    const deletePhotosById = jest.fn();

    const deleter = new PhotoDeleter(deletePhotosById, deletePhotoFromStorage, getPhotosIdsToDelete);

    await deleter.run(limit);

    expect(getPhotosIdsToDelete).toBeCalledTimes(retriveCallsToObtainAll + 1);
    expect(deletePhotosById).toBeCalledTimes(retriveCallsToObtainAll);
    expect(deletePhotosById).toBeCalledWith([
      Array(14).fill(id),
      Array(14).fill(id),
      Array(14).fill(id),
      Array(14).fill(id),
    ]);
  });
});
