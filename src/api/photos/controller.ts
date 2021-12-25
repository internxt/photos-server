import { FastifyRequest, FastifyReply } from 'fastify';
import dayjs from 'dayjs';

import { Photo, PhotoId, PhotoStatus } from '../../models/Photo';
import { PhotosUsecase } from './usecase';
import { CreatePhotoType, GetPhotosQueryParamsType } from './schemas';
import { NotFoundError } from '../errors/http/NotFound';
import { AuthorizedUser } from '../../middleware/auth/jwt';

export class PhotosController {
  private usecase: PhotosUsecase;

  constructor(usecase: PhotosUsecase) {
    this.usecase = usecase;
  }

  async getPhotos(
    req: FastifyRequest<{ Querystring: GetPhotosQueryParamsType }>,
    rep: FastifyReply  
  ) {
    const user = req.user as AuthorizedUser;
    const { from, limit, skip, status } = req.query;

    if (!dayjs(from).isValid()) {
      rep.status(400).send({ message: 'Bad "from" date format' });
    }

    const photos = await this.usecase.obtainPhotos(
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
    const photo = await this.usecase.obtainPhotoById(req.params.id);

    if (!photo) {
      throw new NotFoundError({ resource: 'Photo' });
    }

    if (photo.userId !== user.payload.uuid) {
      return rep.status(403).send({ message: 'Forbidden' });
    }

    rep.send(photo);
  }

  async postPhoto(req: FastifyRequest<{ Body: CreatePhotoType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const photo: Omit<Photo, 'id' | 'status'> = req.body;

    if (photo.width <= 0 || photo.heigth <= 0 || photo.size <= 0) {
      return rep.code(400).send({ message: 'Invalid params' });
    }

    if (photo.userId !== user.payload.uuid) {
      return rep.code(403).send({ message: 'Forbidden' });
    }

    const createdPhoto = await this.usecase.savePhoto({ ...photo, status: PhotoStatus.Exists });

    rep.code(201).send(createdPhoto);
  }

  async deletePhotoById(req: FastifyRequest<{ Params: { id: PhotoId } }>, rep: FastifyReply) {
    const photoId = req.params.id;
    const user = req.user as AuthorizedUser;
    const photo = await this.usecase.obtainPhotoById(photoId);

    if (!photo) {
      throw new NotFoundError({ resource: 'Photo' });
    }

    if (photo.userId !== user.payload.uuid) {
      return rep.send(403).send({ message: 'Forbidden' });
    }

    await this.usecase.removePhoto(req.params.id);

    rep.send({ message: 'Deleted' });
  }
}

// export async function getPhotosByDateRange(req: FastifyRequest<{ Querystring: { userUuid: string, from: string, to: string }}>, rep: FastifyReply) {
//   const from = new Date(req.query.from);
//   const to = new Date(req.query.to);
//   const { userUuid } = req.query;

//   await obtainPhotosByDateRange(userUuid, from, to);
// }
