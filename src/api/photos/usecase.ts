import dayjs from 'dayjs';

import { Photo, PhotoId } from '../../models/Photo';
import { PhotosRepository } from './repository';

export class PhotoNotFoundError extends UsecaseError {
  constructor(photoId: PhotoId) {
    super('Photo ' + photoId + ' not found');
  }
}

export class PhotosUsecase {
  private repository: PhotosRepository;

  constructor(repository: PhotosRepository) {
    this.repository = repository;
  }

  obtainPhotoById(id: PhotoId) {
    return this.repository.getById(id);
  }

  obtainPhotosByDay(userId: string, year: number, month: number, day: number, limit: number, offset: number) {
    const from = new Date();
    from.setFullYear(year, month, day);
    from.setHours(0, 0, 0);

    const to = dayjs(from).add(1, 'day').subtract(1, 'second');

    return this.repository.getByDateRanges(userId, from, to.toDate(), limit, offset);
  }

  obtainPhotosCountByDay(userId: string, year: number, month: number, day: number, limit: number, offset: number) {
    const from = new Date();
    from.setFullYear(year, month, day);
    from.setHours(0, 0, 0);

    const to = dayjs(from).add(1, 'day').subtract(1, 'second');

    return this.repository.getByDateRanges(userId, from, to.toDate(), limit, offset);
  }

  obtainPhotosCountByMonth(userId: string, year: number, month: number, limit: number, offset: number) {
    const from = new Date();
    from.setFullYear(year, month, 0);
    from.setHours(0, 0, 0);

    const to = dayjs(from).add(1, 'month').subtract(1, 'second');

    return this.repository.getCountByDate(userId, from, to.toDate(), limit, offset);
  }

  obtainPhotosCountByYear(userId: string, year: number, limit: number, offset: number) {
    const from = new Date();
    from.setFullYear(year, 0, 1);
    from.setHours(0, 0, 0);

    const to = dayjs(from).add(1, 'year').subtract(1, 'second');

    return this.repository.getCountByDate(userId, from, to.toDate(), limit, offset);
  }

  savePhoto(photo: Omit<Photo, 'id'>): Promise<PhotoId> {
    return this.repository.create(photo);
  }

  removePhoto(photoId: PhotoId): Promise<void> {
    return this.repository.deleteById(photoId);
  }
}
