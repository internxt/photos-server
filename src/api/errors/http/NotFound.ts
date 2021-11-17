export class NotFoundError extends Error {
  statusCode = 404;
  constructor(params: { resource: string }) {
    super(`${params.resource} not found`);
  }
}
