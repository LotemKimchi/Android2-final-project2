import { z } from 'zod';
import { booleanish, objectId, optional, pageQuery } from './common.js';

const content = z.string().trim().max(2000, 'At most 2000 characters');
const date = z.coerce.date({ errorMap: () => ({ message: 'Enter a valid date' }) });

export const MEDIA_FILTER_VALUES = ['any', 'image', 'video', 'none'];

export const createPostSchema = z.object({
  content: content.default(''),
  groupId: optional(objectId),
});

export const updatePostSchema = z.object({
  content: content.optional(),
  removeImage: optional(booleanish),
  removeVideo: optional(booleanish),
});

export const listPostsQuery = z.object({ ...pageQuery });

export const postSearchQuery = z
  .object({
    q: optional(z.string().trim().max(100)),
    authorName: optional(z.string().trim().max(60)),
    authorId: optional(objectId),
    groupId: optional(objectId),
    from: optional(date),
    to: optional(date),
    media: optional(z.enum(MEDIA_FILTER_VALUES)),
    ...pageQuery,
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: '"From" must be before "To"',
    path: ['from'],
  });
