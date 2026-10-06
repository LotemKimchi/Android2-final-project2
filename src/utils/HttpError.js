/** An error that maps directly to an HTTP response. */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'Please log in to continue') {
    return new HttpError(401, message);
  }

  static forbidden(message = 'You do not have permission to do that') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Not found') {
    return new HttpError(404, message);
  }

  static conflict(message, details) {
    return new HttpError(409, message, details);
  }
}
