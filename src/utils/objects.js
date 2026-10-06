/** Drops keys whose value is undefined (so Object.assign never erases a field). */
export function compact(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}
