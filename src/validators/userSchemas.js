import { z } from 'zod';
import { booleanish, optional, pageQuery } from './common.js';
import { GENDERS } from '../models/User.js';
import { calculateAge } from '../presenters/userPresenter.js';

const MIN_AGE = 13;
const MAX_AGE = 120;

/** Reusable field rules shared by register / update / search schemas. */
export const fields = {
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'At least 3 characters')
    .max(30, 'At most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Only letters, numbers and underscores'),
  password: z.string().min(8, 'At least 8 characters').max(100, 'At most 100 characters'),
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
  displayName: z.string().trim().min(1, 'Required').max(60, 'At most 60 characters'),
  birthDate: z.coerce
    .date({ errorMap: () => ({ message: 'Enter a valid date' }) })
    .refine((date) => date <= new Date(), 'Birth date cannot be in the future')
    .refine((date) => calculateAge(date) >= MIN_AGE, `You must be at least ${MIN_AGE}`)
    .refine((date) => calculateAge(date) <= MAX_AGE, 'Enter a realistic birth date'),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Choose a gender' }) }),
  city: z.string().trim().max(60, 'At most 60 characters'),
  bio: z.string().trim().max(300, 'At most 300 characters'),
};

export const registerSchema = z.object({
  username: fields.username,
  password: fields.password,
  email: fields.email,
  displayName: fields.displayName,
  birthDate: fields.birthDate,
  gender: fields.gender,
  city: fields.city.default(''),
});

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, 'Required').max(30),
  password: z.string().min(1, 'Required').max(100),
});

export const userSearchQuery = z
  .object({
    q: optional(z.string().trim().max(60)),
    city: optional(z.string().trim().max(60)),
    gender: optional(z.enum(GENDERS)),
    minAge: optional(z.coerce.number().int().min(0).max(MAX_AGE)),
    maxAge: optional(z.coerce.number().int().min(0).max(MAX_AGE)),
    ...pageQuery,
  })
  .refine((q) => q.minAge === undefined || q.maxAge === undefined || q.minAge <= q.maxAge, {
    message: 'Min age cannot be greater than max age',
    path: ['minAge'],
  });

export const updateProfileSchema = z
  .object({
    displayName: optional(fields.displayName),
    email: optional(fields.email),
    birthDate: optional(fields.birthDate),
    gender: optional(fields.gender),
    city: fields.city.optional(), // "" is allowed: it clears the field
    bio: fields.bio.optional(),
    removeAvatar: optional(booleanish),
    currentPassword: optional(z.string().max(100)),
    newPassword: optional(fields.password),
  })
  .refine((body) => !body.newPassword || body.currentPassword, {
    message: 'Enter your current password',
    path: ['currentPassword'],
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Enter your password to confirm').max(100),
});
