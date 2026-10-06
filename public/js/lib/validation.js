/** Client-side rules mirroring the server's zod schemas (server remains the authority). */

export const LIMITS = {
  usernameMin: 3,
  usernameMax: 30,
  passwordMin: 8,
  passwordMax: 100,
  displayNameMax: 60,
  cityMax: 60,
  bioMax: 300,
  minAge: 13,
  maxAge: 120,
  groupNameMin: 3,
  groupNameMax: 60,
  groupDescriptionMax: 500,
  postMax: 2000,
  messageMax: 1000,
  searchMax: 100,
};

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

function ageFromIsoDate(iso) {
  const birth = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

/** Each rule returns an error message or null. Rules skip blank values except `required`. */
export const rules = {
  required:
    (message = 'This field is required') =>
    (value) =>
      isBlank(value) ? message : null,
  minLength: (min) => (value) =>
    !isBlank(value) && value.length < min ? `At least ${min} characters` : null,
  maxLength: (max) => (value) =>
    !isBlank(value) && value.length > max ? `At most ${max} characters` : null,
  pattern: (regex, message) => (value) => (!isBlank(value) && !regex.test(value) ? message : null),
  email: () => (value) =>
    !isBlank(value) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Enter a valid email' : null,
  matches: (other, message) => (value) => (value !== other ? message : null),
  intRange: (min, max) => (value) => {
    if (isBlank(value)) return null;
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max
      ? null
      : `Enter a whole number between ${min} and ${max}`;
  },
  birthDate: () => (value) => {
    if (isBlank(value)) return null;
    if (Number.isNaN(new Date(value).getTime())) return 'Enter a valid date';
    const age = ageFromIsoDate(value);
    if (age < LIMITS.minAge) return `You must be at least ${LIMITS.minAge}`;
    if (age > LIMITS.maxAge) return 'Enter a realistic birth date';
    return null;
  },
  dateOrder:
    (from, message = '"From" must be before "To"') =>
    (to) =>
      !isBlank(from) && !isBlank(to) && new Date(from) > new Date(to) ? message : null,
  file: (allowedTypes, label) => (file) => {
    if (!file) return null;
    if (!allowedTypes.includes(file.type)) return `Unsupported ${label} type`;
    if (file.size > MAX_UPLOAD_BYTES) return 'File is too large (max 25 MB)';
    return null;
  },
};

/** schema: { field: [rule, ...] } → { field: [message] } for the first failing rule, or null. */
export function validateFields(values, schema) {
  const errors = {};
  for (const [field, checks] of Object.entries(schema)) {
    for (const check of checks) {
      const message = check(values[field]);
      if (message) {
        errors[field] = [message];
        break;
      }
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export const USERNAME_RULES = [
  rules.required(),
  rules.minLength(LIMITS.usernameMin),
  rules.maxLength(LIMITS.usernameMax),
  rules.pattern(/^[a-z0-9_]+$/i, 'Only letters, numbers and underscores'),
];

export const PASSWORD_RULES = [
  rules.required(),
  rules.minLength(LIMITS.passwordMin),
  rules.maxLength(LIMITS.passwordMax),
];

export function groupRules() {
  return {
    name: [
      rules.required(),
      rules.minLength(LIMITS.groupNameMin),
      rules.maxLength(LIMITS.groupNameMax),
    ],
    description: [rules.maxLength(LIMITS.groupDescriptionMax)],
    category: [rules.required('Choose a category')],
  };
}

/** draft: { content, image?: File, video?: File, doodle?: Blob, keepsMedia?: boolean } */
export function validatePostDraft({ content, image, video, doodle, keepsMedia = false }) {
  const errors =
    validateFields(
      { content, image, video },
      {
        content: [rules.maxLength(LIMITS.postMax)],
        image: [rules.file(IMAGE_TYPES, 'image')],
        video: [rules.file(VIDEO_TYPES, 'video')],
      },
    ) ?? {};
  if (image && doodle) errors.image = ['Choose either an uploaded image or a doodle, not both'];
  if (!content && !image && !video && !doodle && !keepsMedia) {
    errors.content = ['Write something or attach an image, video or doodle'];
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
