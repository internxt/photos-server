import { UsecaseError } from '../../core/Usecase';
import { MAX_PHOTOS_IN_SHARE, Share, ShareId } from '../../models/Share';
import { UserId } from '../../models/User';
import { PhotoNotFoundError } from '../photos/usecase';
import { PhotosRepository } from '../photos/repository';
import { SharesRepository } from './repository';
import { NotFoundError } from '../errors/http/NotFound';
import { ExpiredError } from '../errors/http/Expired';
import { Photo } from '../../models/Photo';
import { aes } from '@internxt/lib';
import { Environment } from '@internxt/inxt-js';
import { UsersRepository } from '../users/repository';

export class ShareNotOwnedByThisUserError extends UsecaseError {
  constructor(userId: UserId) {
    super('Photo to share is not owned by the user ' + userId);
  }
}

export class SharesUsecase {
  constructor(
    private repository: SharesRepository,
    private photosRepository: PhotosRepository,
    private usersRepository: UsersRepository,
  ) {}

  async obtainShareById(id: ShareId) {
    const share = await this.repository.getById(id);
    if (!share) {
      throw new NotFoundError({ resource: 'Share' });
    }

    if (share.views <= 0) {
      throw new ExpiredError();
    }
    await this.repository.updateById(id, { views: share.views - 1 });
    return share;
  }

  obtainShareByToken(token: string) {
    return this.repository.getByToken(token);
  }

  async createShare(userUUID: string, data: Omit<Share, 'id'>): Promise<Share> {
    const share: Omit<Share, 'id'> = data;
    const photos = await this.photosRepository.getByMultipleIds(data.photoIds, 0, MAX_PHOTOS_IN_SHARE);

    if (photos.length !== data.photoIds.length) {
      const photoMissingId = data.photoIds.find((id) => !photos.find((photo) => photo.id === id))!;
      throw new PhotoNotFoundError(photoMissingId);
    }

    const { id: userId } = (await this.usersRepository.getByUuid(userUUID))!;

    const allPhotosAreOwnedByThisUser = photos.every((photo) => photo.userId === userId);

    if (!allPhotosAreOwnedByThisUser) {
      throw new ShareNotOwnedByThisUserError(userId);
    }

    return this.repository.create(share);
  }

  updateShare(shareId: string, merge: Pick<Share, 'views'>): Promise<void> {
    return this.repository.updateById(shareId, merge);
  }

  async getPhotosFromShare(
    share: Share,
    mnemonicDecryptionKey: string,
  ): Promise<(Pick<Photo, 'fileId' | 'name' | 'size' | 'type'> & { decryptionKey: string })[]> {
    const mnemonic = aes.decrypt(share.encryptedMnemonic, mnemonicDecryptionKey);
    const photos = [];
    for (const photoId of share.photoIds) {
      const photo = await this.photosRepository.getById(photoId);
      const file = await Environment.getFileInfo(process.env.NETWORK_URL!, share.bucket, photo!.fileId, share.token);
      const decryptionKey = (
        await Environment.utils.generateFileKey(mnemonic, share.bucket, Buffer.from(file.index, 'hex'))
      ).toString('hex');

      const { fileId, name, size, type } = photo!;
      photos.push({ fileId, name, size, type, decryptionKey });
    }
    return photos;
  }
}
