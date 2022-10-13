import { Collection } from 'mongodb';
import { stub } from 'sinon';

import { PhotosRepository } from '../../../src/api/photos/repository';
import { PhotoNotFound, PhotosLookupResponse, PhotosUsecase } from '../../../src/api/photos/usecase';
import { UsersRepository } from '../../../src/api/users/repository';
import { Photo, PhotosItemType, PhotoStatus } from '../../../src/models/Photo';

const PhotosCollectionStubbed = stub(Collection, 'prototype').returns(Collection);
const UsersCollectionStubbed = stub(Collection, 'prototype').returns(Collection);

let photosRepository: PhotosRepository;
let usersRepository: UsersRepository;
let usecase: PhotosUsecase;

beforeEach(() => {
  photosRepository = new PhotosRepository(PhotosCollectionStubbed());
  usersRepository = new UsersRepository(UsersCollectionStubbed());
  usecase = new PhotosUsecase(photosRepository, usersRepository);
});

const user = {
  bucketId: 'bucket',
  id: 'user-id',
  uuid: 'user-uuid'
};
const photoThatExists: Photo = {
  deviceId: 'device-id',
  fileId: 'file-id',
  hash: 'hash',
  height: 500,
  id: 'photo-id',
  name: 'photo-name',
  previewId: 'preview-id',
  size: 5,
  status: PhotoStatus.Exists,
  statusChangedAt: new Date(),
  takenAt: new Date(),
  type: 'jpg',
  userId: 'user-id',
  width: 500,
  itemType: PhotosItemType.PHOTO,
  previews: []
};
const photoThatDoesNotExist: PhotoNotFound = {
  hash: 'some-non-existent-hash',
  name: 'some-non-existent-name',
  takenAt: new Date()
};

describe('Photos usecases', () => {
  describe('Check photos existence with the given characteristics', () => {
    it('When photos are check, found photos should be marked', async () => {
      const photosToCheck: PhotoNotFound[] = [photoThatDoesNotExist, photoThatExists];
      const expected: PhotosLookupResponse = [
        { ...photoThatDoesNotExist, exists: false },
        { ...photoThatExists, exists: true }
      ];

      stub(usersRepository, 'getByUuid').resolves(user);
      stub(photosRepository, 'getByMultipleWhere').resolves([photoThatExists]);

      const received = await usecase.photosWithTheseCharacteristicsExist(
        user.uuid,
        photosToCheck
      );

      expect(received).toStrictEqual(expected);
    });

    it('When a photo is going to be saved, should update the hash if the photo already exists', async () => {
      const existingPhoto: Photo = {...photoThatExists, hash: 'incorrect-hash'};

      stub(photosRepository, 'getOne').resolves(existingPhoto);
      stub(photosRepository, 'updateById').resolves();

      const received = await usecase.savePhoto({...photoThatExists, hash: 'correct-hash'});

      expect(received).toStrictEqual({ ...existingPhoto, hash: 'correct-hash' });
    });

    it('When a photo is going to be saved, should create it if the photo does not exists', async () => {
      const newPhoto: Photo = photoThatExists;

      stub(photosRepository, 'getOne').resolves(null);
      stub(photosRepository, 'create').resolves(newPhoto);
      
      const received = await usecase.savePhoto(photoThatExists);

      expect(received).toStrictEqual(newPhoto);
    });

    it('When a photo is deleted, should be marked as already existent', async () => {
      const deletedPhoto: Photo = { ...photoThatExists, status: PhotoStatus.Deleted };

      stub(usersRepository, 'getByUuid').resolves(user);
      stub(photosRepository, 'getByMultipleWhere').resolves([deletedPhoto]);

      const received = await usecase.photosWithTheseCharacteristicsExist(
        user.uuid,
        [deletedPhoto]
      );

      expect(received).toStrictEqual([{ ...deletedPhoto, exists: true }]);
    });

    it('When a photo is in the trash, should be marked as already existent', async () => {
      const deletedPhoto: Photo = { ...photoThatExists, status: PhotoStatus.Trashed };

      stub(usersRepository, 'getByUuid').resolves(user);
      stub(photosRepository, 'getByMultipleWhere').resolves([deletedPhoto]);

      const received = await usecase.photosWithTheseCharacteristicsExist(
        user.uuid,
        [deletedPhoto]
      );

      expect(received).toStrictEqual([{ ...deletedPhoto, exists: true }]);
    });
  });
});
