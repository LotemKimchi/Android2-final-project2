import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { includesId, sameId } from '../utils/ids.js';

export const RELATIONSHIP = Object.freeze({
  SELF: 'self',
  FRIENDS: 'friends',
  OUTGOING: 'outgoing', // viewer sent a request to target
  INCOMING: 'incoming', // target sent a request to viewer
  NONE: 'none',
});

/** targetUser must include `friends` and `friendRequests`. */
export async function getRelationship(viewerId, targetUser) {
  if (sameId(viewerId, targetUser._id)) return RELATIONSHIP.SELF;
  if (includesId(targetUser.friends, viewerId)) return RELATIONSHIP.FRIENDS;
  if (includesId(targetUser.friendRequests, viewerId)) return RELATIONSHIP.OUTGOING;
  const hasIncoming = await User.exists({ _id: viewerId, friendRequests: targetUser._id });
  return hasIncoming ? RELATIONSHIP.INCOMING : RELATIONSHIP.NONE;
}

export async function areFriends(userId, otherId) {
  return Boolean(await User.exists({ _id: userId, friends: otherId }));
}

export async function getFriendIds(userId) {
  const user = await User.findById(userId).select('friends').lean();
  return user?.friends ?? [];
}

export async function sendFriendRequest(fromId, toId) {
  if (sameId(fromId, toId))
    throw HttpError.badRequest("You can't send a friend request to yourself");

  const [target, sender] = await Promise.all([
    User.findById(toId).select('friends friendRequests').lean(),
    User.findById(fromId).select('friendRequests').lean(),
  ]);
  if (!target) throw HttpError.notFound('User not found');
  if (includesId(target.friends, fromId)) throw HttpError.conflict('You are already friends');
  if (includesId(target.friendRequests, fromId)) return RELATIONSHIP.OUTGOING;

  // They already asked us → sending a request back means "accept".
  if (includesId(sender.friendRequests, toId)) return acceptFriendRequest(fromId, toId);

  await User.updateOne({ _id: toId }, { $addToSet: { friendRequests: fromId } });
  return RELATIONSHIP.OUTGOING;
}

export async function acceptFriendRequest(userId, requesterId) {
  const result = await User.updateOne(
    { _id: userId, friendRequests: requesterId },
    { $pull: { friendRequests: requesterId }, $addToSet: { friends: requesterId } },
  );
  if (result.matchedCount === 0) throw HttpError.notFound('No pending request from this user');

  await User.updateOne(
    { _id: requesterId },
    { $addToSet: { friends: userId }, $pull: { friendRequests: userId } },
  );
  return RELATIONSHIP.FRIENDS;
}

export async function declineFriendRequest(userId, requesterId) {
  const result = await User.updateOne(
    { _id: userId, friendRequests: requesterId },
    { $pull: { friendRequests: requesterId } },
  );
  if (result.matchedCount === 0) throw HttpError.notFound('No pending request from this user');
  return RELATIONSHIP.NONE;
}

/** Unfriend, or cancel a request in either direction. Idempotent. */
export async function removeFriendship(userId, otherId) {
  await Promise.all([
    User.updateOne({ _id: userId }, { $pull: { friends: otherId, friendRequests: otherId } }),
    User.updateOne({ _id: otherId }, { $pull: { friends: userId, friendRequests: userId } }),
  ]);
  return RELATIONSHIP.NONE;
}
