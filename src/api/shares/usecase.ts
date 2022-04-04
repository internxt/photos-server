import { UsecaseError } from '../../core/Usecase';
import { MAX_PHOTOS_IN_SHARE, Share, ShareId } from '../../models/Share';
import { UserId } from '../../models/User';
import { PhotoNotFoundError } from '../photos/usecase';
import { PhotosRepository } from '../photos/repository';
import { SharesRepository } from './repository';
import { NotFoundError } from '../errors/http/NotFound';
import { ExpiredError } from '../errors/http/Expired';

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

  async obtainShareById(id: ShareId) {
    const share = await this.repository.getById(id);
    if (!share) {
      throw new NotFoundError({ resource: 'Share' });
    }

    if (share.views <= 0) {
      throw new ExpiredError();
    }
    await this.repository.update(id, { views: share.views - 1 });
    return share;
  }

  obtainShareByToken(token: string) {
    return this.repository.getByToken(token);
  }

  async createShare(userId: UserId, data: Omit<Share, 'id'>): Promise<Share> {
    const share: Omit<Share, 'id'> = data;
    const photos = await this.photosRepository.getByMultipleIds(data.photoIds, 0, MAX_PHOTOS_IN_SHARE);

    if (photos.length !== data.photoIds.length) {
      const photoMissingId = data.photoIds.find((id) => !photos.find((photo) => photo.id === id))!;
      throw new PhotoNotFoundError(photoMissingId);
    }

    const allPhotosAreOwnedByThisUser = photos.every((photo) => photo.userId === userId);

    if (!allPhotosAreOwnedByThisUser) {
      throw new ShareNotOwnedByThisUserError(userId);
    }

    return this.repository.create(share);
  }

  updateShare(shareId: string, merge: Pick<Share, 'views'>): Promise<void> {
    return this.repository.update(shareId, merge);
  }
}
