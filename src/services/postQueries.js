import { Comment } from '../models/Comment.js';
import { Post } from '../models/Post.js';
import { toPost } from '../presenters/postPresenter.js';
import { HttpError } from '../utils/HttpError.js';
import { skipFor, toPage } from '../utils/pagination.js';
import { canViewPost } from './postAccess.js';

const AUTHOR_FIELDS = 'username displayName avatarUrl';
const GROUP_FIELDS = 'name privacy admins';

function withRelations(query) {
  return query.populate('author', AUTHOR_FIELDS).populate('group', GROUP_FIELDS);
}

/**
 * Adds `commentCount` to each (lean) post. One aggregation for the whole list — not one
 * count query per post (the "N+1 queries" problem).
 */
export async function withCommentCounts(posts) {
  const counts = await Comment.aggregate([
    { $match: { post: { $in: posts.map((post) => post._id) } } },
    { $group: { _id: '$post', count: { $sum: 1 } } },
  ]);
  const countByPost = new Map(counts.map(({ _id, count }) => [String(_id), count]));
  return posts.map((post) => ({ ...post, commentCount: countByPost.get(String(post._id)) ?? 0 }));
}

export async function findPostsPage(filter, { page, limit }, viewerId) {
  const [posts, total] = await Promise.all([
    withRelations(
      Post.find(filter).sort({ createdAt: -1 }).skip(skipFor({ page, limit })).limit(limit),
    ).lean(),
    Post.countDocuments(filter),
  ]);
  const withCounts = await withCommentCounts(posts.filter((post) => post.author));
  const items = withCounts.map((post) => toPost(post, viewerId));
  return toPage({ items, total, page, limit });
}

/** Loads a post with author and group, without any visibility check (callers must own that decision). */
export async function findPostWithRelations(postId) {
  const post = await withRelations(Post.findById(postId)).lean();
  if (!post?.author) throw HttpError.notFound('Post not found');
  return post;
}

/** Loads a post the viewer is allowed to see; hidden posts are reported as not found. */
export async function findVisiblePost(postId, viewerId) {
  const post = await withRelations(Post.findById(postId)).lean();
  if (!post?.author || !(await canViewPost(post, viewerId))) {
    throw HttpError.notFound('Post not found');
  }
  return post;
}
