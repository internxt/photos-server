import crypto from 'crypto';
import { PhotoId } from '../../models/Photo';
import { Share, ShareId } from '../../models/Share';
import { UserId } from '../../models/User';
import { PhotosRepository } from '../photos/repository';
import { SharesRepository } from './repository';

// TODO: Move to core/usecase.ts
class UsecaseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// TODO: Move to photos domain
export class PhotoNotFoundError extends UsecaseError {
  constructor(photoId: PhotoId) {
    super('Photo ' + photoId + ' not found');
  }
}

export class ShareNotFoundError extends UsecaseError {
  constructor(shareId: string) {
    super('Share ' + shareId + ' not found');
  }
}
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

  async createShare(userId: UserId, data: Omit<Share, 'id' | 'token'>): Promise<ShareId> {
    const share: Omit<Share, 'id'> = { ...data, token: crypto.randomBytes(10).toString('hex')};
    const photo = await this.photosRepository.getById(share.photoId);

    if (!photo) {
      throw new PhotoNotFoundError(share.photoId);
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
