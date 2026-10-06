import { z } from 'zod';
import { optional } from './common.js';

export const postsPerMonthQuery = z.object({
  months: optional(z.coerce.number().int().min(1).max(24)).default(12),
});

export const membersPerGroupQuery = z.object({
  limit: optional(z.coerce.number().int().min(1).max(20)).default(10),
});
