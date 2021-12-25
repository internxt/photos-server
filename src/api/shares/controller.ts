import { FastifyRequest, FastifyReply } from 'fastify';

import { SharesUsecase } from './usecase';
import { NotFoundError } from '../errors/http/NotFound';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { Share } from '../../models/Share';
import { CreateShareType, UpdateShareType } from './schemas';

export class SharesController {
  private usecase: SharesUsecase;

  constructor(usecase: SharesUsecase) {
    this.usecase = usecase;
  }

  async getShareByToken(req: FastifyRequest<{ Params: { token: string } }>, rep: FastifyReply) {
    const share = await this.usecase.obtainShareByToken(req.params.token);

    if (!share) {
      throw new NotFoundError({ resource: 'Share' });
    }

    rep.send(share);
  }

  async postShare(req: FastifyRequest<{ Body: CreateShareType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const share: Omit<Share, 'id'> = req.body;

    const createdShare = await this.usecase.saveShare(user.payload.uuid, share);

    rep.code(201).send(createdShare);
  }

  async putShare(req: FastifyRequest<{ Body: UpdateShareType }>, rep: FastifyReply) {
    const shareUpdated: Share = req.body;
    const user = req.user as AuthorizedUser;
    const share = await this.usecase.obtainShareById(shareUpdated.id);

    if (!share) {
      throw new NotFoundError({ resource: 'Photo' });
    }

    await this.usecase.updateShare(user.payload.uuid, share);

    rep.send({ message: 'Deleted' });
  }
}
