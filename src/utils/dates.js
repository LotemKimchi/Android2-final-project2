export function yearsAgo(years, now = new Date()) {
  const date = new Date(now);
  date.setFullYear(date.getFullYear() - years);
  return date;
}

/** Mongo range on birthDate for people aged minAge..maxAge (inclusive). */
export function birthDateRangeForAges(minAge, maxAge, now = new Date()) {
  const range = {};
  if (minAge !== undefined) range.$lte = yearsAgo(minAge, now);
  if (maxAge !== undefined) range.$gt = yearsAgo(maxAge + 1, now);
  return Object.keys(range).length > 0 ? range : undefined;
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfUtcMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addUtcMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

/** "2026-09" style key. */
export function utcMonthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
