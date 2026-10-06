import { z } from 'zod';
import { GROUP_CATEGORIES, GROUP_PRIVACY } from '../models/Group.js';
import { booleanish, objectId, optional, pageQuery } from './common.js';

const name = z.string().trim().min(3, 'At least 3 characters').max(60, 'At most 60 characters');
const description = z.string().trim().max(500, 'At most 500 characters');
const category = z.enum(GROUP_CATEGORIES, { errorMap: () => ({ message: 'Choose a category' }) });
const privacy = z.enum(GROUP_PRIVACY, {
  errorMap: () => ({ message: 'Choose public or private' }),
});

export const createGroupSchema = z.object({
  name,
  description: description.default(''),
  category,
  privacy: privacy.default('public'),
});

export const updateGroupSchema = z.object({
  name: optional(name),
  description: description.optional(),
  category: optional(category),
  privacy: optional(privacy),
});

export const groupSearchQuery = z.object({
  name: optional(z.string().trim().max(60)),
  category: optional(category),
  privacy: optional(privacy),
  minMembers: optional(z.coerce.number().int().min(0).max(1_000_000)),
  mine: optional(booleanish),
  ...pageQuery,
});

export const memberParams = z.object({ id: objectId, userId: objectId });
