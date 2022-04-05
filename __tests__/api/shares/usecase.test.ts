import { Collection } from 'mongodb';
import { stub } from 'sinon';
import { ExpiredError } from '../../../src/api/errors/http/Expired';
import { PhotosRepository } from '../../../src/api/photos/repository';
import { PhotoNotFoundError } from '../../../src/api/photos/usecase';

import { SharesRepository } from '../../../src/api/shares/repository';
import { ShareNotOwnedByThisUserError, SharesUsecase } from '../../../src/api/shares/usecase';
import { UsersRepository } from '../../../src/api/users/repository';
import { Photo, PhotoStatus } from '../../../src/models/Photo';
import { Share } from '../../../src/models/Share';

const SharesCollectionStubbed = stub(Collection, 'prototype').returns(Collection);
const PhotosCollectionStubbed = stub(Collection, 'prototype').returns(Collection);
const UsersCollectionStubbed = stub(Collection, 'prototype').returns(Collection);

let sharesRepository: SharesRepository;
let photosRepository: PhotosRepository;
let usersRepository: UsersRepository;
let sharesUsecase: SharesUsecase;

beforeEach(() => {
  sharesRepository = new SharesRepository(SharesCollectionStubbed());
  photosRepository = new PhotosRepository(PhotosCollectionStubbed());
  usersRepository = new UsersRepository(UsersCollectionStubbed());

  sharesUsecase = new SharesUsecase(sharesRepository, photosRepository, usersRepository);
});

const bucketId = 'bucket-id';
const shareId = 'share-id';
const deviceId = 'device-id';
const userId = 'user-id';
const photoId = 'photo-id';

describe('Shares usecases', () => {
  it('obtainShareById()', async () => {
    const expected: Share = {
      id: shareId,
      bucket: bucketId,
      encryptedMnemonic: 'encriptionKey',
      photoIds: ['aaaaaaaaaaaa'],
      token: 'token',
      views: 5,
    };

    stub(sharesRepository, 'getById').returns(Promise.resolve(expected));
    stub(sharesRepository, 'updateById').returns(Promise.resolve());

    const spy = jest.spyOn(sharesRepository, 'updateById');
    const received = await sharesUsecase.obtainShareById(expected.id);

    expect(received).toStrictEqual(expected);
    expect(spy).toHaveBeenCalledWith(shareId, { views: expected.views - 1 });
  });

  it('obtainShareById() with expired share should throw', async () => {
    const expected: Share = {
      id: shareId,
      bucket: bucketId,
      encryptedMnemonic: 'encriptionKey',
      photoIds: ['aaaaaaaaaaaa'],
      token: 'token',
      views: 0,
    };

    stub(sharesRepository, 'getById').returns(Promise.resolve(expected));
    try {
      await sharesUsecase.obtainShareById(expected.id);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeInstanceOf(ExpiredError);
    }
  });

  it('obtainShareByToken()', async () => {
    const expected: Share = {
      id: shareId,
      bucket: bucketId,
      encryptedMnemonic: 'encriptionKey',
      photoIds: ['aaaaaaaaaaaa'],
      token: 'token',
      views: 5,
    };

    stub(sharesRepository, 'getByToken').returns(Promise.resolve(expected));

    const received = await sharesUsecase.obtainShareByToken(expected.token);

    expect(received).toStrictEqual(expected);
  });

  describe('createShare()', () => {
    it('Should save a share properly', async () => {
      const alreadyExistentPhoto: Photo = {
        deviceId,
        fileId: 'photo-file-id',
        height: 50,
        id: photoId,
        name: 'myphoto',
        previewId: 'previewId',
        size: 400,
        type: 'jpg',
        userId,
        width: 40,
        status: PhotoStatus.Exists,
        hash: '12345',
        takenAt: new Date(),
        statusChangedAt: new Date(),
      };

      const expectedShareId = 'share-id';
      const shareToCreate: Omit<Share, 'id'> = {
        bucket: bucketId,
        encryptedMnemonic: 'encriptionKey',
        photoIds: ['aaaaaaaaaaaa'],
        token: 'token',
        views: 5,
      };

      const getPhotoByIdStub = stub(photosRepository, 'getByMultipleIds').returns(
        Promise.resolve([alreadyExistentPhoto]),
      );
      const createShareStub = stub(sharesRepository, 'create').returns(
        Promise.resolve({ ...shareToCreate, id: expectedShareId }),
      );
      stub(usersRepository, 'getByUuid').returns(Promise.resolve({ id: userId, uuid: 'uuid', bucketId }));

      const received = await sharesUsecase.createShare(alreadyExistentPhoto.userId, shareToCreate);

      expect(getPhotoByIdStub.calledOnce);
      expect(createShareStub.calledOnce);
      expect(received).toEqual({ ...shareToCreate, id: expectedShareId });
    });

    it('Should throw an error if photo not found', async () => {
      const shareToCreate: Omit<Share, 'id'> = {
        bucket: bucketId,
        encryptedMnemonic: 'encriptionKey',
        photoIds: ['aaaaaaaaaaaa'],
        token: 'token',
        views: 5,
      };

      stub(photosRepository, 'getByMultipleIds').returns(Promise.resolve([]));

      try {
        await sharesUsecase.createShare(userId, shareToCreate);
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err).toBeInstanceOf(PhotoNotFoundError);
      }
    });

    it('Should throw an error if photo is not owned by the user', async () => {
      const alreadyExistentPhoto: Photo = {
        deviceId,
        fileId: 'photo-file-id',
        height: 50,
        id: photoId,
        name: 'myphoto',
        previewId: 'previewId',
        size: 400,
        type: 'jpg',
        userId,
        width: 40,
        status: PhotoStatus.Exists,
        hash: '1234',
        takenAt: new Date(),
        statusChangedAt: new Date(),
      };
      const shareToCreate: Omit<Share, 'id'> = {
        bucket: bucketId,
        encryptedMnemonic: 'encriptionKey',
        photoIds: ['aaaaaaaaaaaa'],
        token: 'token',
        views: 5,
      };

      stub(photosRepository, 'getByMultipleIds').returns(Promise.resolve([alreadyExistentPhoto]));
      stub(usersRepository, 'getByUuid').returns(
        Promise.resolve({ id: userId + 'notthisuser', uuid: 'uuid', bucketId }),
      );

      try {
        await sharesUsecase.createShare('uuid', shareToCreate);
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err).toBeInstanceOf(ShareNotOwnedByThisUserError);
      }
    });
  });

  describe('updateShare()', () => {
    it('Should update a share properly', async () => {
      const alreadyExistentPhoto: Photo = {
        deviceId,
        fileId: 'photo-file-id',
        height: 50,
        id: photoId,
        name: 'myphoto',
        previewId: 'previewId',
        size: 400,
        type: 'jpg',
        userId,
        width: 40,
        hash: '1234',
        status: PhotoStatus.Exists,
        takenAt: new Date(),
        statusChangedAt: new Date(),
      };

      const shareToUpdate: Share = {
        id: shareId,
        bucket: bucketId,
        encryptedMnemonic: 'encriptionKey',
        photoIds: ['aaaaaaaaaaaa'],
        token: 'token',
        views: 5,
      };

      const getPhotoByIdStub = stub(photosRepository, 'getById').returns(Promise.resolve(alreadyExistentPhoto));
      const updateShareStub = stub(sharesRepository, 'updateById').returns(Promise.resolve(undefined));

      try {
        await sharesUsecase.updateShare(alreadyExistentPhoto.userId, shareToUpdate);
        expect(true).toBeTruthy();
      } catch (err) {
        expect(true).toBeFalsy();
      }

      expect(getPhotoByIdStub.calledOnce);
      expect(updateShareStub.calledOnce);
    });

    // it('Should throw an error if photo not found', async () => {
    //   const shareToUpdate: Share = {
    //     id: shareId,
    //     bucket: bucketId,
    //     encryptedMnemonic: 'encriptionKey',
    //     photoIds: 'aaaaaaaaaaaa',
    //     token: 'token',
    //     views: 5
    //   };

    //   stub(photosRepository, 'getById').returns(Promise.resolve(null));
    //   stub(sharesRepository, 'update').returns(Promise.resolve());

    //   try {
    //     await sharesUsecase.updateShare(shareId, shareToUpdate);
    //     expect(true).toBeFalsy();
    //   } catch (err) {
    //     console.log(err);
    //     expect(err).toBeInstanceOf(PhotoNotFoundError);
    //   }
    // });

    // it('Should throw an error if photo is not owned by the user', async () => {
    //   const alreadyExistentPhoto: Photo = {
    //     deviceId,
    //     fileId: 'photo-file-id',
    //     height: 50,
    //     id: photoIds,
    //     name: 'myphoto',
    //     previewId: 'previewId',
    //     size: 400,
    //     type: 'jpg',
    //     userId,
    //     width: 40,
    //     status: PhotoStatus.Exists,
    //     takenAt: new Date(),
    //     statusChangedAt: new Date()
    //   };
    //   const shareToUpdate: Share = {
    //     id: shareId,
    //     bucket: bucketId,
    //     encryptedMnemonic: 'encriptionKey',
    //     photoIds: 'aaaaaaaaaaaa',
    //     token: 'token',
    //     views: 5
    //   };

    //   stub(photosRepository, 'getById').returns(Promise.resolve(alreadyExistentPhoto));
    //   stub(sharesRepository, 'update').returns(Promise.resolve());

    //   try {
    //     await sharesUsecase.updateShare(shareId, shareToUpdate);
    //     expect(true).toBeFalsy();
    //   } catch (err) {
    //     expect(err).toBeInstanceOf(ShareNotOwnedByThisUserError);
    //   }
    // });
  });
});
