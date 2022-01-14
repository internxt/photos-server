import { FastifyRequest, FastifyReply } from 'fastify';
import dayjs from 'dayjs';

import { NewPhoto, PhotoId } from '../../models/Photo';
import { PhotosUsecase } from './usecase';
import { CreatePhotoType, GetPhotosQueryParamsType } from './schemas';
import { NotFoundError } from '../errors/http/NotFound';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { UsersUsecase } from '../users/usecase';
import { dateToUTC } from '../../lib/utils';
import { DevicesUsecase } from '../devices/usecase';

export class PhotosController {
  private photosUsecase: PhotosUsecase;
  private usersUsecase: UsersUsecase;
  private devicesUsecase: DevicesUsecase;

  constructor(photosUsecase: PhotosUsecase, usersUsecase: UsersUsecase, devicesUsecase: DevicesUsecase) {
    this.photosUsecase = photosUsecase;
    this.usersUsecase = usersUsecase;
    this.devicesUsecase = devicesUsecase;
  }

  async getPhotos(
    req: FastifyRequest<{ Querystring: GetPhotosQueryParamsType }>,
    rep: FastifyReply  
  ) {
    const user = req.user as AuthorizedUser;
    const { from, limit, skip, status } = req.query;

    // TODO: from is the future + cast date to UTC
    if (!dayjs(from).isValid()) {
      rep.status(400).send({ message: 'Bad "from" date format' });
    }

    const photos = await this.photosUsecase.obtainPhotos(
      user.payload.uuid, 
      new Date(from),
      limit, 
      skip,
      status
    );

    rep.send(photos);
  }

  async getPhotoById(req: FastifyRequest<{ Params: { id: PhotoId } }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const photo = await this.photosUsecase.obtainPhotoById(req.params.id);

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

    photo.creationDate = dateToUTC(photo.creationDate);
    const creationDate = dayjs(photo.creationDate);
    const createdInTheFuture = creationDate.isAfter(new Date());

    if (!creationDate.isValid() || createdInTheFuture) {
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

    await this.devicesUsecase.updateSynchronizedAt(photo.deviceId, photo.creationDate);

    rep.code(201).send(createdPhoto);
  }

  async deletePhotoById(req: FastifyRequest<{ Params: { id: PhotoId } }>, rep: FastifyReply) {
    const photoId = req.params.id;
    const user = req.user as AuthorizedUser;
    const photo = await this.photosUsecase.obtainPhotoById(photoId);

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
