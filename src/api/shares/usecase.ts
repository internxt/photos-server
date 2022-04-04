import { randomBytes } from 'crypto';

import { UsecaseError } from '../../core/Usecase';
import { Share, ShareId } from '../../models/Share';
import { UserId } from '../../models/User';
import { PhotoNotFoundError } from '../photos/usecase';
import { PhotosRepository } from '../photos/repository';
import { SharesRepository } from './repository';

export class ShareNotOwnedByThisUserError extends UsecaseError {
  constructor(userId: UserId) {
    super('Photo to share is not owned by the user ' + userId);
  }
}

export class SharesUsecase {
  private repository: SharesRepository;
  private photosRepository: PhotosRepository;

  constructor(repository: SharesRepository, photosRepository: PhotosRepository) {
    this.repository = repository;
    this.photosRepository = photosRepository;
  }

  obtainShareById(id: ShareId) {
    return this.repository.getById(id);
  }

  obtainShareByToken(token: string) {
    return this.repository.getByToken(token);
  }

  async createShare(userId: UserId, data: Omit<Share, 'id' | 'token'>): Promise<Share> {
    const share: Omit<Share, 'id'> = { ...data, token: randomBytes(10).toString('hex') };
    const photo = await this.photosRepository.getById(share.photoIds[0]);

    if (!photo) {
      throw new PhotoNotFoundError(share.photoIds[0]);
    }

    if (photo.userId !== userId) {
      throw new ShareNotOwnedByThisUserError(userId);
    }

    return this.repository.create(share);
  }

  updateShare(shareId: string, merge: Pick<Share, 'views'>): Promise<void> {
    return this.repository.update(shareId, merge);
  }
}
