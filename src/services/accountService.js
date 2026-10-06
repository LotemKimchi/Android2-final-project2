import { Group } from '../models/Group.js';
import { Message } from '../models/Message.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { deleteUploadsByUrl } from '../utils/files.js';
import { deleteGroupCascade } from './groupService.js';

/**
 * Removes a user and everything that belongs to them. Local MongoDB runs standalone (no
 * transactions), so steps are ordered to leave the least damage if one fails midway:
 * dependent data first, the user document last.
 */
export async function deleteAccount(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const ownedGroups = await Group.find({ owner: userId });
  for (const group of ownedGroups) await deleteGroupCascade(group);

  const posts = await Post.find({ author: userId }).select('imageUrl videoUrl').lean();
  await Promise.all([
    Post.deleteMany({ author: userId }),
    Post.updateMany({ likes: userId }, { $pull: { likes: userId } }),
    Message.deleteMany({ $or: [{ from: userId }, { to: userId }] }),
    Group.updateMany(
      { $or: [{ members: userId }, { pendingMembers: userId }] },
      { $pull: { members: userId, admins: userId, pendingMembers: userId } },
    ),
    User.updateMany(
      { $or: [{ friends: userId }, { friendRequests: userId }] },
      { $pull: { friends: userId, friendRequests: userId } },
    ),
  ]);
  await user.deleteOne();

  await deleteUploadsByUrl([user.avatarUrl, ...posts.flatMap((p) => [p.imageUrl, p.videoUrl])]);
}
