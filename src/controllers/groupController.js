import { Group } from '../models/Group.js';
import { toGroup } from '../presenters/groupPresenter.js';
import { toUserSummary } from '../presenters/userPresenter.js';
import {
  assertAdmin,
  assertOwner,
  canViewContent,
  findGroupOr404,
} from '../services/groupAccess.js';
import { deleteGroupCascade } from '../services/groupService.js';
import { HttpError } from '../utils/HttpError.js';
import { compact } from '../utils/objects.js';
import { skipFor, toPage } from '../utils/pagination.js';
import { containsRegex } from '../utils/regex.js';

function buildGroupSearchFilter({ name, category, privacy, minMembers, mine }, viewerId) {
  const filter = {};
  if (name) filter.name = containsRegex(name);
  if (category) filter.category = category;
  if (privacy) filter.privacy = privacy;
  if (minMembers !== undefined) filter.$expr = { $gte: [{ $size: '$members' }, minMembers] };
  if (mine) filter.members = viewerId;
  return filter;
}

export async function searchGroups(req, res) {
  const query = req.valid.query;
  const filter = buildGroupSearchFilter(query, req.user.id);
  const [groups, total] = await Promise.all([
    Group.find(filter).sort({ createdAt: -1 }).skip(skipFor(query)).limit(query.limit).lean(),
    Group.countDocuments(filter),
  ]);
  res.json(
    toPage({
      items: groups.map((group) => toGroup(group, req.user.id)),
      total,
      page: query.page,
      limit: query.limit,
    }),
  );
}

export async function createGroup(req, res) {
  const userId = req.user.id;
  const group = await Group.create({
    ...req.valid.body,
    owner: userId,
    admins: [userId],
    members: [userId],
  });
  res.status(201).json({ group: toGroup(group, userId) });
}

export async function getGroup(req, res) {
  const group = await Group.findById(req.valid.params.id).populate('owner');
  if (!group) throw HttpError.notFound('Group not found');
  res.json({
    group: toGroup(group, req.user.id),
    owner: toUserSummary(group.owner),
    canViewContent: canViewContent(group, req.user.id),
  });
}

export async function updateGroup(req, res) {
  const group = await findGroupOr404(req.valid.params.id);
  assertAdmin(group, req.user.id);

  const wasPrivate = group.privacy === 'private';
  Object.assign(group, compact(req.valid.body));

  // Opening a private group to the public auto-approves everyone who was waiting.
  if (wasPrivate && group.privacy === 'public' && group.pendingMembers.length > 0) {
    group.members.addToSet(...group.pendingMembers);
    group.pendingMembers = [];
  }

  await group.save();
  res.json({ group: toGroup(group, req.user.id) });
}

export async function deleteGroup(req, res) {
  const group = await findGroupOr404(req.valid.params.id);
  assertOwner(group, req.user.id);
  await deleteGroupCascade(group);
  res.status(204).end();
}
