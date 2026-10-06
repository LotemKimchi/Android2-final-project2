import { z } from 'zod';
import { objectId, optional } from './common.js';

const text = z
  .string({ invalid_type_error: 'Message must be text' })
  .trim()
  .min(1, 'Message cannot be empty')
  .max(1000, 'At most 1000 characters');

export const sendMessageSchema = z.object({ to: objectId, text });
export const updateMessageSchema = z.object({ text });
export const conversationParams = z.object({ userId: objectId });
export const conversationQuery = z.object({
  before: optional(z.coerce.date()),
  limit: optional(z.coerce.number().int().min(1).max(100)).default(30),
});
