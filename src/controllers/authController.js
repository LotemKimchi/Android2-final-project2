import { User } from '../models/User.js';
import { toPrivateUser } from '../presenters/userPresenter.js';
import { hashPassword, verifyPassword } from '../services/passwords.js';
import { HttpError } from '../utils/HttpError.js';
import { clearAuthCookie, setAuthCookie } from '../utils/jwt.js';

export async function register(req, res) {
  const { password, ...profile } = req.valid.body;
  const user = await User.create({ ...profile, passwordHash: await hashPassword(password) });
  setAuthCookie(res, user._id);
  res.status(201).json({ user: toPrivateUser(user) });
}

export async function login(req, res) {
  const { username, password } = req.valid.body;
  const user = await User.findOne({ username }).select('+passwordHash');
  const isValid = user && (await verifyPassword(password, user.passwordHash));
  if (!isValid) throw HttpError.unauthorized('Invalid username or password');

  setAuthCookie(res, user._id);
  res.json({ user: toPrivateUser(user) });
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  res.json({ user: toPrivateUser(user) });
}
