import { Group } from '../models/Group.js';
import { HttpError } from '../utils/HttpError.js';
import { includesId, sameId } from '../utils/ids.js';

export async function findGroupOr404(groupId) {
  const group = await Group.findById(groupId);
  if (!group) throw HttpError.notFound('Group not found');
  return group;
}

export const isOwner = (group, userId) => sameId(group.owner, userId);
export const isAdmin = (group, userId) => includesId(group.admins, userId);
export const isMember = (group, userId) => includesId(group.members, userId);
export const isPending = (group, userId) => includesId(group.pendingMembers, userId);

export function roleOf(group, userId) {
  if (isOwner(group, userId)) return 'owner';
  if (isAdmin(group, userId)) return 'admin';
  if (isMember(group, userId)) return 'member';
  if (isPending(group, userId)) return 'pending';
  return 'none';
}

export function canViewContent(group, userId) {
  return group.privacy === 'public' || isMember(group, userId);
}

export function assertAdmin(group, userId) {
  if (!isAdmin(group, userId)) throw HttpError.forbidden('Only group admins can do that');
}

export function assertOwner(group, userId) {
  if (!isOwner(group, userId)) throw HttpError.forbidden('Only the group owner can do that');
}

/** Groups whose posts the user may read: every public group plus private groups they belong to. */
export function viewableGroupIds(userId) {
  return Group.distinct('_id', { $or: [{ privacy: 'public' }, { members: userId }] });
}

export function memberGroupIds(userId) {
  return Group.distinct('_id', { members: userId });
}
