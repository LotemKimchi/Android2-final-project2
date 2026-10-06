import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { AUTH_COOKIE, clearAuthCookie, verifyToken } from '../utils/jwt.js';

/**
 * Resolves the logged-in user from the JWT cookie. Always continues; guards below decide access.
 * Loads the user from the DB so deleted accounts lose access immediately.
 */
export async function authenticate(req, res, next) {
  req.user = null;
  res.locals.currentUser = null;

  const payload = verifyToken(req.cookies?.[AUTH_COOKIE]);
  if (!payload) {
    if (req.cookies?.[AUTH_COOKIE]) clearAuthCookie(res);
    return next();
  }

  const user = await User.findById(payload.sub).select('username displayName avatarUrl').lean();
  if (!user) {
    clearAuthCookie(res);
    return next();
  }

  req.user = {
    id: String(user._id),
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
  res.locals.currentUser = req.user;
  next();
}

export function requireAuth(req, _res, next) {
  next(req.user ? undefined : HttpError.unauthorized());
}

export function requirePageAuth(req, res, next) {
  if (!req.user) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  next();
}

export function requireGuestPage(req, res, next) {
  if (req.user) return res.redirect('/feed');
  next();
}
