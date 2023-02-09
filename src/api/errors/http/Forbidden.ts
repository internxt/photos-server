export class ForbiddenError extends Error {
    statusCode = 403;
    constructor() {
      super('You cannot access this resource');
    }
  }
  