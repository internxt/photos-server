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

  async obtainPhotos(userUuid: string, from: Date, limit: number, skip: number, status?: PhotoStatus) {
    const user = await this.usersRepository.getByUuid(userUuid);

    if (!user) {
      throw new UsecaseError(`User with uuid ${userUuid} does not exist`);
    }
    
    return this.photosRepository.getByUserIdAndAfterDate(
      user.id, 
      from,
      status ? { status } : {}, 
      skip, 
      limit
    );
  }

  obtainPhotoById(id: PhotoId) {
    return this.photosRepository.getById(id);
  }

  obtainPhotosByDay(userId: string, year: number, month: number, day: number, limit: number, offset: number) {
    const from = new Date();
    from.setFullYear(year, month, day);
    from.setHours(0, 0, 0);

    const to = dayjs(from).add(1, 'day').subtract(1, 'second');

    return this.photosRepository.getByDateRanges(userId, from, to.toDate(), limit, offset);
  }

  obtainPhotosCountByDay(userId: string, year: number, month: number, day: number, limit: number, offset: number) {
    const from = new Date();
    from.setFullYear(year, month, day);
    from.setHours(0, 0, 0);

    const to = dayjs(from).add(1, 'day').subtract(1, 'second');

    return this.photosRepository.getByDateRanges(userId, from, to.toDate(), limit, offset);
  }

  obtainPhotosCountByMonth(userId: string, year: number, month: number, limit: number, offset: number) {
    const from = new Date();
    from.setFullYear(year, month, 0);
    from.setHours(0, 0, 0);

    const to = dayjs(from).add(1, 'month').subtract(1, 'second');

    return this.photosRepository.getCountByDate(userId, from, to.toDate(), limit, offset);
  }

  obtainPhotosCountByYear(userId: string, year: number, limit: number, offset: number) {
    const from = new Date();
    from.setFullYear(year, 0, 1);
    from.setHours(0, 0, 0);

    const to = dayjs(from).add(1, 'year').subtract(1, 'second');

    return this.photosRepository.getCountByDate(userId, from, to.toDate(), limit, offset);
  }

  savePhoto(photo: NewPhoto): Promise<Photo> {
    const photoToCreate: Omit<Photo, 'id'> = {
      ...photo,
      status: PhotoStatus.Exists,
      lastStatusChangeAt: new Date()
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
      lastStatusChangeAt: new Date()
    });
  }
}
