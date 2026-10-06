import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { HttpError } from '../utils/HttpError.js';
import { removeRequestUploads } from '../utils/files.js';

function fromZod(error) {
  const details = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_';
    (details[field] ??= []).push(issue.message);
  }
  return HttpError.badRequest('Please fix the highlighted fields', details);
}

function fromMongooseValidation(error) {
  const details = Object.fromEntries(
    Object.entries(error.errors).map(([field, fieldError]) => [field, [fieldError.message]]),
  );
  return HttpError.badRequest('Please fix the highlighted fields', details);
}

/** Maps known error types to HttpError; returns null for unexpected errors. */
function toHttpError(error) {
  if (error instanceof HttpError) return error;
  if (error instanceof ZodError) return fromZod(error);
  if (error instanceof mongoose.Error.ValidationError) return fromMongooseValidation(error);
  if (error instanceof mongoose.Error.CastError) {
    return HttpError.badRequest(`Invalid value for ${error.path}`);
  }
  if (error?.code === 11000) {
    const field = Object.keys(error.keyValue ?? {})[0] ?? 'value';
    const message = `That ${field} is already taken`;
    return HttpError.conflict(message, { [field]: [message] });
  }
  if (error instanceof multer.MulterError) {
    return error.code === 'LIMIT_FILE_SIZE'
      ? new HttpError(413, 'File is too large (max 25 MB)')
      : HttpError.badRequest(`Upload error: ${error.message}`);
  }
  if (error?.type === 'entity.parse.failed') return HttpError.badRequest('Malformed JSON body');
  if (error?.type === 'entity.too.large') return new HttpError(413, 'Request body is too large');
  if (error instanceof mongoose.Error.VersionError) {
    return HttpError.conflict('This item was changed by someone else — please retry');
  }
  // Remaining body-parser / http-errors 4xx (415 charset, 413 too many parameters, 400 aborted).
  if (error?.expose && error.status >= 400 && error.status < 500) {
    return new HttpError(error.status, error.message);
  }
  return null;
}

function wantsHtml(req) {
  return !req.originalUrl.startsWith('/api/') && req.accepts(['json', 'html']) === 'html';
}

export function notFoundHandler(req, _res, next) {
  next(HttpError.notFound(`Page not found: ${req.originalUrl}`));
}

// Express recognises error handlers by arity, so all four parameters must stay.
export async function errorHandler(error, req, res, next) {
  await removeRequestUploads(req);

  const httpError = toHttpError(error);
  if (!httpError) console.error('Unexpected error:', error);

  const status = httpError?.status ?? 500;
  const message = httpError?.message ?? 'Something went wrong. Please try again.';
  if (res.headersSent) return next(error);

  if (wantsHtml(req)) {
    res.status(status).render('pages/error', { title: 'Error', status, message });
    return;
  }
  res.status(status).json({ error: { message, details: httpError?.details } });
}
