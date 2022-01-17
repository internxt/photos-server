import { FastifyRequest, FastifyReply } from 'fastify';
import dayjs from 'dayjs';

import { NewPhoto, PhotoId } from '../../models/Photo';
import { PhotosUsecase } from './usecase';
import { CreatePhotoType, GetPhotosQueryParamsType } from './schemas';
import { NotFoundError } from '../errors/http/NotFound';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { UsersUsecase } from '../users/usecase';
import { dateToUTC } from '../../lib/utils';

export class PhotosController {
  private photosUsecase: PhotosUsecase;
  private usersUsecase: UsersUsecase;

  constructor(photosUsecase: PhotosUsecase, usersUsecase: UsersUsecase) {
    this.photosUsecase = photosUsecase;
    this.usersUsecase = usersUsecase;
  }

  async getPhotos(
    req: FastifyRequest<{ Querystring: GetPhotosQueryParamsType }>,
    rep: FastifyReply  
  ) {
    const user = req.user as AuthorizedUser;
    const { name, status, statusChangedAt, limit, skip, deviceId } = req.query;

    // TODO: from is the future + cast date to UTC
    if (!dayjs(statusChangedAt).isValid()) {
      rep.status(400).send({ message: 'Bad "from" date format' });
    }

    const {results, count} = await this.photosUsecase.get(
      user.payload.uuid, 
      { name, status, statusChangedAt: statusChangedAt ? new Date(statusChangedAt) : undefined, deviceId},
      skip,
      limit
    );

    rep.send({results, count});
  }

  async getPhotoById(req: FastifyRequest<{ Params: { id: PhotoId } }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const photo = await this.photosUsecase.getById(req.params.id);

    if (!photo) {
      throw new NotFoundError({ resource: 'Photo' });
    }

    const photosUser = await this.usersUsecase.obtainUserByUuid(user.payload.uuid);

    if (!photosUser) {
      return rep.status(400).send();
    }

    if (photo.userId !== photosUser.id) {
      return rep.status(403).send({ message: 'Forbidden' });
    }

    rep.send(photo);
  }

  async postPhoto(req: FastifyRequest<{ Body: CreatePhotoType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const photo: NewPhoto = req.body;

    if (photo.width <= 0 || photo.height <= 0 || photo.size <= 0) {
      return rep.code(400).send({ message: 'Invalid params' });
    }

    photo.takenAt = dateToUTC(photo.takenAt);
    const takenAt = dayjs(photo.takenAt);
    const createdInTheFuture = takenAt.isAfter(new Date());

    if (!takenAt.isValid() || createdInTheFuture) {
      return rep.code(400).send({ message: 'Invalid params' });
    }

    const photosUser = await this.usersUsecase.obtainUserByUuid(user.payload.uuid);

    if (!photosUser) {
      return rep.status(400).send();
    }

    if (photo.userId !== photosUser.id) {
      return rep.status(403).send({ message: 'Forbidden' });
    }

    const createdPhoto = await this.photosUsecase.savePhoto(photo);

    rep.code(201).send(createdPhoto);
  }

  async deletePhotoById(req: FastifyRequest<{ Params: { id: PhotoId } }>, rep: FastifyReply) {
    const photoId = req.params.id;
    const user = req.user as AuthorizedUser;
    const photo = await this.photosUsecase.getById(photoId);

    if (!photo) {
      throw new NotFoundError({ resource: 'Photo' });
    }

    const photosUser = await this.usersUsecase.obtainUserByUuid(user.payload.uuid);

    if (!photosUser) {
      return rep.status(400).send();
    }

    if (photo.userId !== photosUser.id) {
      return rep.status(403).send({ message: 'Forbidden' });
    }

    await this.photosUsecase.deletePhoto(req.params.id);

    rep.send({ message: 'Deleted' });
  }
}
