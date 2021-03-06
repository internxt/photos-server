import { FastifyRequest, FastifyReply } from 'fastify';

import { SharesUsecase } from './usecase';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { CreateShareType, UpdateShareType } from './schemas';
import { Share } from '../../models/Share';

export class SharesController {
  private usecase: SharesUsecase;

  constructor(usecase: SharesUsecase) {
    this.usecase = usecase;
  }

  async getShare(req: FastifyRequest<{ Params: { id: string }; Querystring: { code: string } }>, rep: FastifyReply) {
    const share = await this.usecase.obtainShareById(req.params.id);
    const photos = await this.usecase.getPhotosFromShare(share, req.query.code);

    const { encryptedMnemonic: _, ...rest } = share;

    rep.send({ ...rest, photos });
  }

  async postShare(req: FastifyRequest<{ Body: CreateShareType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const share: Omit<Share, 'id'> = req.body;

    const createdShare = await this.usecase.createShare(user.payload.uuid, share);

    rep.code(201).send(createdShare);
  }

  async patchShare(req: FastifyRequest<{ Params: { id: string }; Body: UpdateShareType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;

    await this.usecase.updateShare(req.params.id, user.payload.uuid, req.body);

    rep.code(200).send();
  }
}
