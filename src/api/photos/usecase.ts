import { UsecaseError } from '../../core/Usecase';
import { PhotoDocument } from '../../database/mongo/models/Photo';

import { NewPhoto, Photo, PhotoId, PhotoStatus } from '../../models/Photo';
import { User } from '../../models/User';
import { UsersRepository } from '../users/repository';
import { PhotosRepository } from './repository';

export type PhotoNotFound = Pick<Photo, 'name' | 'takenAt' | 'hash'>;
export type PhotosLookupResponse = ((Photo | PhotoNotFound) & { exists: boolean })[]

export class PhotoNotFoundError extends UsecaseError {
  constructor(photoId: PhotoId) {
    super('Photo ' + photoId + ' not found');
  }
}

export class WrongBucketIdError extends UsecaseError {
  constructor(bucketId: User['bucketId']) {
    super('Bucket' + (bucketId ? ` ${bucketId}` : '') + ' is wrong');
  }
}

export class PhotosUsecase {
  private photosRepository: PhotosRepository;
  private usersRepository: UsersRepository;

  constructor(photosRepository: PhotosRepository, usersRepository: UsersRepository) {
    this.photosRepository = photosRepository;
    this.usersRepository = usersRepository;
  }

  getById(id: PhotoId) {
    return this.photosRepository.getById(id);
  }

  async get(
    userUuid: string,
    filter: { name?: string, status?: PhotoStatus, statusChangedAt?: Date, deviceId?: string },
    skip: number,
    limit: number,
  ): Promise<{ results: Photo[], count: number }> {
    const user = await this.usersRepository.getByUuid(userUuid);

    if (!user) {
      throw new UsecaseError(`User with uuid ${userUuid} does not exist`);
    }

    const results = await this.photosRepository.get({ userId: user.id, ...filter }, skip, limit);
    const count = await this.photosRepository.count({ userId: user.id, ...filter });

    return { results, count };
  }

  async photosWithTheseCharacteristicsExist(
    userUuid: User['uuid'],
    photos: PhotoNotFound[]
  ): Promise<PhotosLookupResponse> {
    const user = await this.usersRepository.getByUuid(userUuid);

    if (!user) {
      throw new UsecaseError('User does not exist');
    }

    const foundPhotos: Photo[] = await this.photosRepository.getByMultipleWhere(
      photos.map(p => ({ ...p, userId: user.id }))
    );

    return photos.map((photo) => {
      const foundPhotoIndex = foundPhotos.findIndex((foundPhoto) => {
        return foundPhoto.name === photo.name &&
          foundPhoto.takenAt.toString() === photo.takenAt.toString() &&
          foundPhoto.hash === photo.hash;
      });

      const photoFound = foundPhotoIndex !== -1;

      if (photoFound) {
        return { ...foundPhotos[foundPhotoIndex], exists: true };
      } else {
        return { ...photo, exists: false };
      }
    });
  }

  async getUsage(userUuid: string): Promise<number> {
    const user = await this.usersRepository.getByUuid(userUuid);
    const usage = user ? await this.photosRepository.getUsage(user.id) : 0;

    return usage;
  }

  async savePhoto(data: NewPhoto): Promise<Photo> {
    const now = new Date();
    const photoToCreate: Omit<Photo, 'id'> = {
      ...data,
      status: PhotoStatus.Exists,
      statusChangedAt: now
    };

    /**
     * PATCH PHOTO HASH
     * 
     * In Drive-mobile the photo hash was malformed, since the
     * hash was created using a malformed value, now that is fixed
     * we need to patch the hash of those photos that match
     * in name and date with the photo that wants to be saved so we
     * avoid duplicated photos.
     * 
     * If the incoming photo matches in name and date with an already
     * existing photo, we don't create the photo, we just update the hash
     * of the one that already exists because it means that the photo
     * was already uploaded, but the hash was wrong.
     */

    const existingPhoto = await this.photosRepository.getOne({
      userId: data.userId,
      name: data.name,
      takenAt: data.takenAt,
    });

    if (!existingPhoto) {
      const user = await this.usersRepository.getByBucket(data.networkBucketId);

      if (!user) {
        throw new WrongBucketIdError(data.networkBucketId);
      }

      await this.usersRepository.updateGalleryUsage(user.id, photoToCreate.size);
      return this.photosRepository.create(photoToCreate);
    } else {

      if (existingPhoto.hash === photoToCreate.hash) {
        throw new UsecaseError('A photo with this characteristics already exists');
      }

      await this.photosRepository.updateById(existingPhoto.id, {
        hash: data.hash
      });

      return {
        ...existingPhoto,
        hash: data.hash
      };
    }
  }

  async deletePhoto(photoId: string) {
    return this.changePhotoStatus(photoId, PhotoStatus.Deleted);
  }

  async trashPhoto(photoId: string) {
    return this.changePhotoStatus(photoId, PhotoStatus.Trashed);
  }

  async updateById(photoId: PhotoId, changes: Partial<PhotoDocument>): Promise<void> {
    await this.photosRepository.updateById(photoId, changes);
  }

  private async changePhotoStatus(photoId: PhotoId, newStatus: PhotoStatus): Promise<void> {
    const photo = await this.photosRepository.getById(photoId);
    if (photo) {
      if (newStatus === PhotoStatus.Deleted) {
        await this.usersRepository.updateTrashUsage(photo.userId, -photo.size);
      } else if (newStatus === PhotoStatus.Trashed) {
        await this.usersRepository.updateGalleryUsage(photo.userId, -photo.size);
        await this.usersRepository.updateTrashUsage(photo.userId, +photo.size);
      }

      await this.photosRepository.updateById(photoId, {
        status: newStatus,
        statusChangedAt: new Date()
      });
    }
  }
}
