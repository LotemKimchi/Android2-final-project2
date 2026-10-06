/** Compares ObjectIds, populated documents and strings by their hex value. */
export function sameId(a, b) {
  if (a == null || b == null) return false;
  return String(a._id ?? a) === String(b._id ?? b);
}

export function includesId(ids = [], id) {
  return ids.some((candidate) => sameId(candidate, id));
}
