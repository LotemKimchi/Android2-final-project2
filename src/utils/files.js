import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

export const UPLOAD_URL_PREFIX = '/uploads/';

export function toPublicUrl(file) {
  return file ? `${UPLOAD_URL_PREFIX}${file.filename}` : '';
}

/** Best-effort removal of a file we previously stored; never throws. */
export async function deleteUploadByUrl(url) {
  if (!url?.startsWith(UPLOAD_URL_PREFIX)) return;
  const filePath = path.join(env.uploadDir, path.basename(url));
  await fs.unlink(filePath).catch(() => {});
}

export async function deleteUploadsByUrl(urls) {
  await Promise.all(urls.filter(Boolean).map(deleteUploadByUrl));
}

/** Removes files multer saved for a request that ended up failing. */
export async function removeRequestUploads(req) {
  const files = [req.file, ...Object.values(req.files ?? {}).flat()].filter(Boolean);
  await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));
}
