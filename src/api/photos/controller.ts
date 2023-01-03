import { FastifyRequest, FastifyReply } from 'fastify';
import dayjs from 'dayjs';

import { NewPhoto, Photo, PhotoId } from '../../models/Photo';
import { PhotosUsecase, WrongBucketIdError } from './usecase';
import { CheckPhotosExistenceType, CreatePhotoType, GetPhotosQueryParamsType, UpdatePhotoType } from './schemas';
import { NotFoundError } from '../errors/http/NotFound';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { UsersUsecase } from '../users/usecase';
import { dateToUTC } from '../../lib/utils';
import { DevicesUsecase } from '../devices/usecase';
import { Environment } from '@internxt/inxt-js';

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
    req: FastifyRequest<{
      Querystring: GetPhotosQueryParamsType;
    }>,
    rep: FastifyReply,
  ) {
    const user = req.user as AuthorizedUser;
    const { name, status, updatedAt, limit, skip, deviceId, includeDownloadLinks } = req.query;

    // TODO: from is the future + cast date to UTC
    if (!dayjs(updatedAt).isValid()) {
      rep.status(400).send({ message: 'Bad "from" date format' });
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
      const response = await network.getDownloadLinks(
        photosUser!.bucketId,
        results.map((photo) => photo.previewId),
      );


      const resultsWithDownloadLinks = response.map((result, i) => ({
        ...results[i],
        previewLink: (result && result.link) || '',
        previewIndex: (result && result.index) || '',
      }));

      rep.send({ results: resultsWithDownloadLinks, bucketId: photosUser!.bucketId });
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

    //const usage = await this.photosUsecase.getUsage(user.payload.uuid);

    rep.send({ usage: 0 });
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
    const user = req.user as AuthorizedUser;
    const body: NewPhoto = req.body;

    if (body.width <= 0 || body.height <= 0 || body.size <= 0) {
      return rep.code(400).send({ message: 'Invalid params' });
    }

    body.takenAt = dateToUTC(body.takenAt);
    const takenAt = dayjs(body.takenAt);
    const createdInTheFuture = takenAt.isAfter(new Date());

    if (!takenAt.isValid() || createdInTheFuture) {
      return rep.code(400).send({ message: 'Invalid params' });
    }

    const photosUser = await this.usersUsecase.obtainUserByUuid(user.payload.uuid);

    if (!photosUser) {
      return rep.status(400).send();
    }

    if (body.userId !== photosUser.id) {
      return rep.status(403).send({ message: 'Forbidden' });
    }

    const device = await this.devicesUsecase.getDeviceById(body.deviceId);

    if (!device) {
      return rep.status(400).send({ message: 'Device not found' });
    }

    let createdPhoto: Photo;

    try {
      createdPhoto = await this.photosUsecase.savePhoto(body);
    } catch (err) {
      if (err instanceof WrongBucketIdError) {
        return rep.status(400).send({ message: err.message });
      }
      throw err;
    }

    this.usersUsecase.updateGalleryUsage(createdPhoto.userId, createdPhoto.size).catch(() => {
      // ignore updating usage error
    });

    if (createdPhoto.takenAt.getTime() > device.newestDate.getTime()) {
      this.devicesUsecase.updateNewestDate(createdPhoto.deviceId, createdPhoto.takenAt);
    }

    if (!device.oldestDate || createdPhoto.takenAt.getTime() < device.oldestDate.getTime()) {
      this.devicesUsecase.updateOldestDate(createdPhoto.deviceId, createdPhoto.takenAt);
    }

    rep.code(201).send(createdPhoto);
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

    this.usersUsecase.updateGalleryUsage(photo.userId, -photo.size).catch(() => {
      // ignore updating usage error
    });

    rep.send({ message: 'Deleted' });
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
