import { User } from '../models/User.js';
import { toPrivateUser, toPublicUser } from '../presenters/userPresenter.js';
import { deleteAccount } from '../services/accountService.js';
import { getRelationship, RELATIONSHIP } from '../services/friendService.js';
import { hashPassword, verifyPassword } from '../services/passwords.js';
import { birthDateRangeForAges } from '../utils/dates.js';
import { deleteUploadByUrl, toPublicUrl } from '../utils/files.js';
import { HttpError } from '../utils/HttpError.js';
import { clearAuthCookie } from '../utils/jwt.js';
import { compact } from '../utils/objects.js';
import { skipFor, toPage } from '../utils/pagination.js';
import { containsRegex } from '../utils/regex.js';

function buildUserSearchFilter({ q, city, gender, minAge, maxAge }) {
  const filter = {};
  if (q) filter.$or = [{ username: containsRegex(q) }, { displayName: containsRegex(q) }];
  if (city) filter.city = containsRegex(city);
  if (gender) filter.gender = gender;
  const birthDate = birthDateRangeForAges(minAge, maxAge);
  if (birthDate) filter.birthDate = birthDate;
  return filter;
}

export async function searchUsers(req, res) {
  const query = req.valid.query;
  const filter = buildUserSearchFilter(query);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ displayName: 1 }).skip(skipFor(query)).limit(query.limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json(toPage({ items: users.map(toPublicUser), total, page: query.page, limit: query.limit }));
}

export async function getUser(req, res) {
  const user = await User.findById(req.valid.params.id).lean();
  if (!user) throw HttpError.notFound('User not found');

  const relationship = await getRelationship(req.user.id, user);
  const isSelf = relationship === RELATIONSHIP.SELF;
  res.json({ user: isSelf ? toPrivateUser(user) : toPublicUser(user), relationship });
}

export async function updateMe(req, res) {
  const { currentPassword, newPassword, removeAvatar, ...profile } = req.valid.body;
  const user = await User.findById(req.user.id).select('+passwordHash');

  if (newPassword) {
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw HttpError.badRequest('Current password is incorrect', {
        currentPassword: ['Current password is incorrect'],
      });
    }
    user.passwordHash = await hashPassword(newPassword);
  }

  const previousAvatar = user.avatarUrl;
  Object.assign(user, compact(profile));
  if (req.file) user.avatarUrl = toPublicUrl(req.file);
  else if (removeAvatar) user.avatarUrl = '';

  await user.save();
  if (user.avatarUrl !== previousAvatar) await deleteUploadByUrl(previousAvatar);
  res.json({ user: toPrivateUser(user) });
}

export async function deleteMe(req, res) {
  const user = await User.findById(req.user.id).select('+passwordHash');
  const isValid = await verifyPassword(req.valid.body.password, user.passwordHash);
  if (!isValid) {
    throw HttpError.badRequest('Password is incorrect', { password: ['Password is incorrect'] });
  }
  await deleteAccount(req.user.id);
  clearAuthCookie(res);
  res.status(204).end();
}
