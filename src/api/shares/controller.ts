import { FastifyRequest, FastifyReply } from 'fastify';

import { SharesUsecase } from './usecase';
import { NotFoundError } from '../errors/http/NotFound';
import { AuthorizedUser } from '../../middleware/auth/jwt';
import { CreateShareType, UpdateShareType } from './schemas';
import { Share } from '../../models/Share';

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

    const createdShare = await this.usecase.createShare(user.payload.uuid, share);

    rep.code(201).send(createdShare);
  }

  async putShare(req: FastifyRequest<{ Body: UpdateShareType }>, rep: FastifyReply) {
    const { id, views } = req.body;
    const share = await this.usecase.obtainShareById(id);

    if (!share) {
      throw new NotFoundError({ resource: 'Share' });
    }

    await this.usecase.updateShare(id, { views });

    rep.send({ message: 'Share updated' });
  }
}
