import { Group } from '../models/Group.js';
import { toGroup } from '../presenters/groupPresenter.js';
import { toPublicUser } from '../presenters/userPresenter.js';
import {
  assertAdmin,
  assertOwner,
  canViewContent,
  findGroupOr404,
  isAdmin,
  isMember,
  isOwner,
  isPending,
  roleOf,
} from '../services/groupAccess.js';
import { HttpError } from '../utils/HttpError.js';

async function saveAndRespond(res, group, viewerId) {
  await group.save();
  res.json({ group: toGroup(group, viewerId) });
}

export async function listMembers(req, res) {
  const group = await Group.findById(req.valid.params.id).populate('members');
  if (!group) throw HttpError.notFound('Group not found');
  if (!canViewContent(group, req.user.id)) {
    throw HttpError.forbidden('Join this group to see its members');
  }
  const items = group.members.map((member) => ({
    ...toPublicUser(member),
    role: roleOf(group, member._id),
  }));
  res.json({ items });
}

export async function joinGroup(req, res) {
  const userId = req.user.id;
  const group = await findGroupOr404(req.valid.params.id);
  if (isPending(group, userId)) throw HttpError.conflict('Your join request is already pending');
  if (isMember(group, userId)) throw HttpError.conflict('You are already a member');

  if (group.privacy === 'public') group.members.addToSet(userId);
  else group.pendingMembers.addToSet(userId);
  await saveAndRespond(res, group, userId);
}

/** Leave the group, or cancel a pending join request. */
export async function leaveGroup(req, res) {
  const userId = req.user.id;
  const group = await findGroupOr404(req.valid.params.id);
  if (isOwner(group, userId)) {
    throw HttpError.badRequest('The owner cannot leave the group — delete it instead');
  }
  if (!isMember(group, userId) && !isPending(group, userId)) {
    throw HttpError.badRequest('You are not a member of this group');
  }
  group.members.pull(userId);
  group.admins.pull(userId);
  group.pendingMembers.pull(userId);
  await saveAndRespond(res, group, userId);
}

export async function listJoinRequests(req, res) {
  const group = await Group.findById(req.valid.params.id).populate('pendingMembers');
  if (!group) throw HttpError.notFound('Group not found');
  assertAdmin(group, req.user.id);
  res.json({ items: group.pendingMembers.map(toPublicUser) });
}

async function loadRequestContext(req) {
  const group = await findGroupOr404(req.valid.params.id);
  assertAdmin(group, req.user.id);
  const { userId } = req.valid.params;
  if (!isPending(group, userId)) throw HttpError.notFound('No pending request from this user');
  return { group, userId };
}

export async function approveJoinRequest(req, res) {
  const { group, userId } = await loadRequestContext(req);
  group.pendingMembers.pull(userId);
  group.members.addToSet(userId);
  await saveAndRespond(res, group, req.user.id);
}

export async function declineJoinRequest(req, res) {
  const { group, userId } = await loadRequestContext(req);
  group.pendingMembers.pull(userId);
  await saveAndRespond(res, group, req.user.id);
}

export async function removeMember(req, res) {
  const actorId = req.user.id;
  const { userId } = req.valid.params;
  const group = await findGroupOr404(req.valid.params.id);
  assertAdmin(group, actorId);

  if (!isMember(group, userId)) throw HttpError.notFound('This user is not a member');
  if (isOwner(group, userId)) throw HttpError.badRequest('The owner cannot be removed');
  if (isAdmin(group, userId) && !isOwner(group, actorId)) {
    throw HttpError.forbidden('Only the owner can remove an admin');
  }
  group.members.pull(userId);
  group.admins.pull(userId);
  await saveAndRespond(res, group, actorId);
}

export async function promoteAdmin(req, res) {
  const { userId } = req.valid.params;
  const group = await findGroupOr404(req.valid.params.id);
  assertAdmin(group, req.user.id);
  if (!isMember(group, userId)) throw HttpError.badRequest('Only members can become admins');
  if (isAdmin(group, userId)) throw HttpError.conflict('This member is already an admin');
  group.admins.addToSet(userId);
  await saveAndRespond(res, group, req.user.id);
}

export async function demoteAdmin(req, res) {
  const { userId } = req.valid.params;
  const group = await findGroupOr404(req.valid.params.id);
  assertOwner(group, req.user.id);
  if (isOwner(group, userId)) throw HttpError.badRequest('The owner is always an admin');
  if (!isAdmin(group, userId)) throw HttpError.badRequest('This member is not an admin');
  group.admins.pull(userId);
  await saveAndRespond(res, group, req.user.id);
}
