import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

const EXTENSION_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

/** Which media kind each form field accepts. */
const KIND_BY_FIELD = { avatar: 'image', image: 'image', video: 'video' };

const storage = multer.diskStorage({
  destination: env.uploadDir,
  // Never trust the client's filename: random name + extension derived from the mime type.
  filename: (_req, file, done) => done(null, `${randomUUID()}${EXTENSION_BY_MIME[file.mimetype]}`),
});

function fileFilter(_req, file, done) {
  const expectedKind = KIND_BY_FIELD[file.fieldname];
  const isAllowed =
    file.mimetype in EXTENSION_BY_MIME && file.mimetype.startsWith(`${expectedKind}/`);
  if (!isAllowed) {
    return done(
      HttpError.badRequest('Unsupported file type', {
        [file.fieldname]: [
          `Please upload ${expectedKind === 'image' ? 'an image' : expectedKind === 'video' ? 'a video' : 'a supported file'}`,
        ],
      }),
    );
  }
  done(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_BYTES, files: 2, fields: 20 },
});

export const uploadAvatar = upload.single('avatar');
export const uploadPostMedia = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);
