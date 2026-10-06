import { includesId, sameId } from '../utils/ids.js';
import { toUserSummary } from './userPresenter.js';

/** Expects `author` populated and `group` populated with name, privacy, admins (or null). */
export function toPost(post, viewerId) {
  const isAuthor = sameId(post.author, viewerId);
  const isGroupAdmin = Boolean(post.group) && includesId(post.group.admins, viewerId);
  return {
    id: String(post._id),
    content: post.content,
    imageUrl: post.imageUrl,
    videoUrl: post.videoUrl,
    createdAt: post.createdAt,
    edited: Boolean(post.editedAt),
    author: toUserSummary(post.author),
    group: post.group
      ? { id: String(post.group._id), name: post.group.name, privacy: post.group.privacy }
      : null,
    likeCount: post.likes.length,
    likedByMe: includesId(post.likes, viewerId),
    canEdit: isAuthor,
    canDelete: isAuthor || isGroupAdmin,
  };
}
