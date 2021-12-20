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

  async saveShare(userId: UserId, share: Omit<Share, 'id'>): Promise<ShareId> {
    const photo = await this.photosRepository.getById(share.photoId);

    if (!photo) {
      throw new PhotoNotFoundError(share.photoId);
    }

    if (photo.userId !== userId) {
      throw new ShareNotOwnedByThisUserError(userId);
    }

    return this.repository.create(share);
  }

  async updateShare(userId: UserId, share: Share): Promise<Share> {
    const photo = await this.photosRepository.getById(share.photoId);

    if (!photo) {
      throw new PhotoNotFoundError(share.photoId);
    }

    if (photo.userId !== userId) {
      throw new ShareNotOwnedByThisUserError(userId);
    }
    return this.repository.update(share);
  }
}
