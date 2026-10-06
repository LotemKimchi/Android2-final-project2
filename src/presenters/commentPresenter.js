import { includesId, sameId } from '../utils/ids.js';
import { toUserSummary } from './userPresenter.js';

/**
 * Expects comment.author populated. `post` is the commented post with `group` populated with
 * admins (or null) — the post's author and group admins may moderate its comments.
 */
export function toComment(comment, viewerId, post) {
  const isAuthor = sameId(comment.author, viewerId);
  const isPostAuthor = sameId(post.author, viewerId);
  const isGroupAdmin = Boolean(post.group) && includesId(post.group.admins, viewerId);
  return {
    id: String(comment._id),
    postId: String(comment.post),
    content: comment.content,
    createdAt: comment.createdAt,
    edited: Boolean(comment.editedAt),
    author: toUserSummary(comment.author),
    canEdit: isAuthor,
    canDelete: isAuthor || isPostAuthor || isGroupAdmin,
  };
}
