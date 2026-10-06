import { z } from 'zod';

const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value);

/** Optional field where an empty form value ("") counts as "not provided". */
export const optional = (schema) => z.preprocess(emptyToUndefined, schema.optional());

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const idParams = z.object({ id: objectId });

/** Accepts true/false as JSON booleans or as "true"/"false" form strings. */
export const booleanish = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

export const pageQuery = {
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(1000).default(1)),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(50).default(10)),
};
