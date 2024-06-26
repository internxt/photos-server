import { FastifyRequest, FastifyReply } from 'fastify';
import dayjs from 'dayjs';

import { NewPhoto, Photo, PhotoId } from '../../models/Photo';
import { PhotosUsecase, WrongBucketIdError } from './usecase';
import { 
  CheckPhotosExistenceType, 
  CreatePhotoType, 
  DeletePhotosType, 
  GetPhotosQueryParamsType, 
  GetPhotosSortedQueryParamsType, 
  TrashPhotosType, 
  UpdatePhotoType 
} from './schemas';
import { NotFoundError } from '../errors/http/NotFound';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { UsersUsecase } from '../users/usecase';
import { dateToUTC } from '../../lib/utils';
import { DevicesUsecase } from '../devices/usecase';
import { Environment } from '@internxt/inxt-js';
import { ForbiddenError } from '../errors/http/Forbidden';

export class PhotosController {
  private photosUsecase: PhotosUsecase;
  private usersUsecase: UsersUsecase;
  private devicesUsecase: DevicesUsecase;

  constructor(photosUsecase: PhotosUsecase, usersUsecase: UsersUsecase, devicesUsecase: DevicesUsecase) {
    this.photosUsecase = photosUsecase;
    this.usersUsecase = usersUsecase;
    this.devicesUsecase = devicesUsecase;
  }

  async getPhotosSorted(
    req: FastifyRequest<{
      Querystring: GetPhotosSortedQueryParamsType;
    }>,
    rep: FastifyReply,
  ) {
    const user = req.user as AuthorizedUser;
    const { status, updatedAt, limit, skip, sortBy, sortType, includeDownloadLinks } = req.query;

    // TODO: from is the future + cast date to UTC
    if (!dayjs(updatedAt).isValid()) {
      return rep.status(400).send({ message: 'Bad "updatedAt" date format' });
    }

    if (limit > 200) {
      return rep.status(400).send({ message: 'Maximum allowed "limit" is 200' });
    }

    const results = await this.photosUsecase.getSorted(
      user.payload.uuid,
      { status, updatedAt: updatedAt ? new Date(updatedAt) : undefined },
      sortBy,
      sortType as ('ASC' | 'DESC'),
      skip,
      limit,
    );

    if (!includeDownloadLinks) {
      rep.send({ results });
    } else {
      const { user: bridgeUser, pass: bridgePass } = user.payload.networkCredentials;
      const network = new Environment({
        bridgeUrl: process.env.NETWORK_URL,
        bridgePass,
        bridgeUser,
      });

      const photosUser = await this.usersUsecase.obtainUserByUuid(user.payload.uuid);
      
      if(!photosUser) throw new NotFoundError({ resource: 'Photos User' });
      
      const response = await network.getDownloadLinks(
        photosUser.bucketId,
        results.map((photo) => photo.previewId),
      );


      const resultsWithDownloadLinks = response.map((result, i) => ({
        ...results[i],
        previewLink: (result && result.link) || '',
        previewIndex: (result && result.index) || '',
      }));

      rep.send({ results: resultsWithDownloadLinks, bucketId: photosUser.bucketId });
    }
  }

  async getPhotos(
    req: FastifyRequest<{
      Querystring: GetPhotosQueryParamsType;
    }>,
    rep: FastifyReply,
  ) {
    const user = req.user as AuthorizedUser;
    const { name, status, updatedAt, limit, skip, deviceId, includeDownloadLinks } = req.query;

    // TODO: from is the future + cast date to UTC
    if (!dayjs(updatedAt).isValid()) {
      return rep.status(400).send({ message: 'Bad "from" date format' });
    }

    if (limit > 200) {
      return rep.status(400).send({ message: 'Maximum allowed "limit" is 200' });
    }

    const results = await this.photosUsecase.get(
      user.payload.uuid,
      { name, status, updatedAt: updatedAt ? new Date(updatedAt) : undefined, deviceId },
      skip,
      limit,
    );

    if (!includeDownloadLinks) {
      rep.send({ results });
    } else {
      const { user: bridgeUser, pass: bridgePass } = user.payload.networkCredentials;
      const network = new Environment({
        bridgeUrl: process.env.NETWORK_URL,
        bridgePass,
        bridgeUser,
      });

      const photosUser = await this.usersUsecase.obtainUserByUuid(user.payload.uuid);
      
      if(!photosUser) throw new NotFoundError({ resource: 'Photos User' });

      const response = await network.getDownloadLinks(
        photosUser.bucketId,
        results.map((photo) => photo.previewId),
      );


      const resultsWithDownloadLinks = response.map((result, i) => ({
        ...results[i],
        previewLink: (result && result.link) || '',
        previewIndex: (result && result.index) || '',
      }));

      rep.send({ results: resultsWithDownloadLinks, bucketId: photosUser.bucketId });
    }
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

  async getUsage(req: FastifyRequest, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;

    const { galleryUsage, trashUsage } = await this.photosUsecase.getUsage(user.payload.uuid);

    rep.send({ usage: galleryUsage + trashUsage });
  }

  async findOrCreatePhoto(req: FastifyRequest<{ Body: CreatePhotoType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;

    const body = req.body;
    body.takenAt = dateToUTC(body.takenAt);
    const [checkedPhoto] = await this.photosUsecase.photosWithTheseCharacteristicsExist(user.payload.uuid, [{
      name: body.name,
      takenAt: body.takenAt,
      hash: body.hash
    }]);

    if (checkedPhoto.exists) {
      return rep.code(200).send(checkedPhoto);
    } else {
      return this.postPhoto(req, rep);
    }
  }

  async postPhoto(req: FastifyRequest<{ Body: CreatePhotoType }>, rep: FastifyReply) {
    return rep.status(404).send({ message: 'Not found' });
  }

  async updatePhotoById(req: FastifyRequest<{ Params: { id: PhotoId }; Body: UpdatePhotoType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const photoId = req.params.id;
    const body = req.body;
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

    await this.photosUsecase.updateById(req.params.id, body);

    rep.send({ message: 'Updated photo' });
  }

  async deletePhotosById(req: FastifyRequest<{ Body: DeletePhotosType }>, rep: FastifyReply) {
    if (req.body.photos.length > 200) {
      return rep.status(400).send({ message: 'You can only delete max 200 items at the same time' });
    }
    const user = req.user as AuthorizedUser;
    const photosUser = await this.usersUsecase.obtainUserByUuid(user.payload.uuid);
    if (!photosUser) {
      return rep.status(400).send();
    }
    const photos = await this.photosUsecase.getByMultipleIds(
      (req.body.photos as { id: string }[]).map((photo) => photo.id),
      0,
      200,
    );

    for (const photo of photos) {
      if (!photo) throw new NotFoundError({ resource: 'Photo' });
      if (photo.userId !== photosUser.id) {
         throw new ForbiddenError();
      }
    }

    for (const photo of photos) {
      await this.photosUsecase.deletePhoto(photo.id);
      await this.usersUsecase.updateGalleryUsage(photo.userId, -photo.size);
    }

    rep.send({ message: 'Deleted' });
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

    this.usersUsecase.updateGalleryUsage(photo.userId, -photo.size).catch((err) => {
      req.log.error(err);
    });

    rep.send({ message: 'Deleted' });
  }

  async trashPhotosById(req: FastifyRequest<{ Body: TrashPhotosType }>, rep: FastifyReply) {
    if (req.body.photos.length > 200) {
      return rep.status(400).send({ message: 'You can only trash max 200 items at the same time' });
    }
    const user = req.user as AuthorizedUser;
    const photosUser = await this.usersUsecase.obtainUserByUuid(user.payload.uuid);
    if (!photosUser) {
      return rep.status(400).send();
    }
    const photos = await this.photosUsecase.getByMultipleIds(
      (req.body.photos as { id: string }[]).map((photo) => photo.id),
      0,
      200,
    );

    for (const photo of photos) {
      if (!photo) throw new NotFoundError({ resource: 'Photo' });
      if (photo.userId !== photosUser.id) {
        throw new ForbiddenError();
      }
    }

    for (const photo of photos) {
      await this.photosUsecase.trashPhoto(photo.id);
    }

    rep.send({ message: 'Trashed' });
  }

  async trashPhotoById(req: FastifyRequest<{ Params: { id: PhotoId } }>, rep: FastifyReply) {
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

    await this.photosUsecase.trashPhoto(req.params.id);

    rep.send({ message: 'Trashed' });
  }

  async photosExist(req: FastifyRequest<{ Body: CheckPhotosExistenceType }>, rep: FastifyReply) {
    const { photos } = req.body;
    const user = req.user as AuthorizedUser;

    if (photos.length > 50) {
      return rep.status(413).send('Sent photos can not be more than 50');
    }

    const photosWithDate: Pick<Photo, 'name' | 'takenAt' | 'hash'>[] = [];

    for (const photo of photos) {
      if (!dayjs(photo.takenAt).isValid()) {
        return rep.status(400).send({ message: 'Bad "takenAt" date format for photo with hash ' + photo.hash });
      }

      photosWithDate.push({ ...photo, takenAt: dateToUTC(photo.takenAt) });
    }

    const existenceChecks = await this.photosUsecase.photosWithTheseCharacteristicsExist(
      user.payload.uuid,
      photosWithDate
    );

    rep.send({ photos: existenceChecks });
  }

  async getPhotosCounts(req: FastifyRequest, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;

    const { existent, trashed, deleted, total } = await this.photosUsecase.getPhotosCounts(user.payload.uuid);

    rep.send({ existent, trashed, deleted, total });
  }
}
