import { z } from 'zod';

export const COMMENT_MAX = 500;

const content = z
  .string({ required_error: 'Write something first' })
  .trim()
  .min(1, 'Write something first')
  .max(COMMENT_MAX, `At most ${COMMENT_MAX} characters`);

export const createCommentSchema = z.object({ content });

export const updateCommentSchema = z.object({ content });
