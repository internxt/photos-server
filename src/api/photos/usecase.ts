import dayjs from 'dayjs';
import { UsecaseError } from '../../core/Usecase';

import { NewPhoto, Photo, PhotoId, PhotoStatus } from '../../models/Photo';
import { UsersRepository } from '../users/repository';
import { PhotosRepository } from './repository';

export class PhotoNotFoundError extends UsecaseError {
  constructor(photoId: PhotoId) {
    super('Photo ' + photoId + ' not found');
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
    filter: {name?: string, status?: PhotoStatus, statusChangedAt?: Date, deviceId?: string },
    skip: number,
    limit: number,
  ): Promise<{results: Photo[], count: number}> {
    const user = await this.usersRepository.getByUuid(userUuid);

    if (!user) {
      throw new UsecaseError(`User with uuid ${userUuid} does not exist`);
    }
    
    const results = await this.photosRepository.get({userId: user.id, ...filter}, skip, limit);
    const count = await this.photosRepository.count({userId: user.id, ...filter});

    return { results, count };
  }

  savePhoto(photo: NewPhoto): Promise<Photo> {
    const photoToCreate: Omit<Photo, 'id'> = {
      ...photo,
      status: PhotoStatus.Exists,
      statusChangedAt: new Date()
    };

    return this.photosRepository.create(photoToCreate);
  }

  async deletePhoto(photoId: string) {
    return this.changePhotoStatus(photoId, PhotoStatus.Deleted);
  }

  async trashPhoto(photoId: string) {
    return this.changePhotoStatus(photoId, PhotoStatus.Trashed);
  }

  private async changePhotoStatus(photoId: PhotoId, newStatus: PhotoStatus): Promise<void> {
    await this.photosRepository.updateById(photoId, { 
      status: newStatus,
      statusChangedAt: new Date()
    });
  }
}
