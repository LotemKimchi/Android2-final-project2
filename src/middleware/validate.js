const SOURCES = ['params', 'query', 'body'];

/**
 * Parses request parts with zod schemas. Parsed (coerced, trimmed) values land on req.valid;
 * a ZodError is thrown on failure and turned into a 400 by the error handler.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid = req.valid ?? {};
    for (const source of SOURCES) {
      if (schemas[source]) req.valid[source] = schemas[source].parse(req[source] ?? {});
    }
    next();
  };
}
