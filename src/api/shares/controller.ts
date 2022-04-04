import { FastifyRequest, FastifyReply } from 'fastify';

import { SharesUsecase } from './usecase';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { CreateShareType } from './schemas';
import { Share } from '../../models/Share';

export class SharesController {
  private usecase: SharesUsecase;

  constructor(usecase: SharesUsecase) {
    this.usecase = usecase;
  }

  async getShare(req: FastifyRequest<{ Params: { id: string } }>, rep: FastifyReply) {
    const share = await this.usecase.obtainShareById(req.params.id);

    rep.send(share);
  }

  async postShare(req: FastifyRequest<{ Body: CreateShareType }>, rep: FastifyReply) {
    const user = req.user as AuthorizedUser;
    const share: Omit<Share, 'id'> = req.body;

    const createdShare = await this.usecase.createShare(user.payload.uuid, share);

    rep.code(201).send(createdShare);
  }
}
