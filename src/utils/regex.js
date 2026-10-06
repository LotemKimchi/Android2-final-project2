const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/** Case-insensitive "contains" matcher that treats user input literally. */
export function containsRegex(text) {
  return new RegExp(text.replace(REGEX_SPECIAL_CHARS, '\\$&'), 'i');
}
