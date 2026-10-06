import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env.js';

export const AUTH_COOKIE = 'token';
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/' };

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: TOKEN_TTL_SECONDS });
}

/** Returns the payload, or null for a missing / expired / tampered token. */
export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

export function setAuthCookie(res, userId) {
  res.cookie(AUTH_COOKIE, signToken(userId), {
    ...cookieOptions,
    maxAge: TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}
