export class ExpiredError extends Error {
  statusCode = 410;
  constructor() {
    super('This resource has expired');
  }
}
