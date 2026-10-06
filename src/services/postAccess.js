import { Group } from '../models/Group.js';
import { sameId } from '../utils/ids.js';
import { areFriends, getFriendIds } from './friendService.js';
import { memberGroupIds, viewableGroupIds } from './groupAccess.js';

/**
 * Posts a user may read anywhere (search, profiles, direct links):
 * - group posts in public groups or in private groups they belong to
 * - profile posts by themselves or their friends
 */
export async function visiblePostsFilter(userId) {
  const [groupIds, friendIds] = await Promise.all([viewableGroupIds(userId), getFriendIds(userId)]);
  return {
    $or: [{ group: { $in: groupIds } }, { group: null, author: { $in: [...friendIds, userId] } }],
  };
}

/** The personal feed: posts from groups the user joined + profile posts by friends and self. */
export async function feedFilter(userId) {
  const [groupIds, friendIds] = await Promise.all([memberGroupIds(userId), getFriendIds(userId)]);
  return {
    $or: [{ group: { $in: groupIds } }, { group: null, author: { $in: [...friendIds, userId] } }],
  };
}

/** post.group must be populated with `privacy` (or null). */
export async function canViewPost(post, userId) {
  if (post.group) {
    if (post.group.privacy === 'public') return true;
    return Boolean(await Group.exists({ _id: post.group._id, members: userId }));
  }
  return sameId(post.author, userId) || areFriends(userId, post.author._id ?? post.author);
}
