import { Comment } from '../models/Comment.js';
import { toComment } from '../presenters/commentPresenter.js';
import { findPostWithRelations, findVisiblePost } from '../services/postQueries.js';
import { HttpError } from '../utils/HttpError.js';
import { includesId, sameId } from '../utils/ids.js';

const AUTHOR_FIELDS = 'username displayName avatarUrl';

async function findCommentOr404(commentId) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw HttpError.notFound('Comment not found');
  return comment;
}

/** GET /api/posts/:id/comments — oldest first, so a thread reads top to bottom. */
export async function listComments(req, res) {
  const userId = req.user.id;
  const post = await findVisiblePost(req.valid.params.id, userId); // enforces visibility
  const comments = await Comment.find({ post: post._id })
    .sort({ createdAt: 1 })
    .populate('author', AUTHOR_FIELDS)
    .lean();
  const items = comments
    .filter((comment) => comment.author)
    .map((comment) => toComment(comment, userId, post));
  res.json({ items });
}

/** POST /api/posts/:id/comments */
export async function createComment(req, res) {
  const userId = req.user.id;
  const post = await findVisiblePost(req.valid.params.id, userId); // can't comment on what you can't see
  const comment = await Comment.create({
    post: post._id,
    author: userId,
    content: req.valid.body.content,
  });
  await comment.populate('author', AUTHOR_FIELDS);
  res.status(201).json({ comment: toComment(comment, userId, post) });
}

/** PATCH /api/comments/:id — only the comment's author may change its words. */
export async function updateComment(req, res) {
  const userId = req.user.id;
  const comment = await findCommentOr404(req.valid.params.id);
  if (!sameId(comment.author, userId)) {
    throw HttpError.forbidden('You can only edit your own comments');
  }
  const post = await findVisiblePost(comment.post, userId);

  comment.content = req.valid.body.content;
  comment.editedAt = new Date();
  await comment.save();

  await comment.populate('author', AUTHOR_FIELDS);
  res.json({ comment: toComment(comment, userId, post) });
}

/** DELETE /api/comments/:id — the comment's author, the post's author or a group admin. */
export async function deleteComment(req, res) {
  const userId = req.user.id;
  const comment = await findCommentOr404(req.valid.params.id);
  const post = await findPostWithRelations(comment.post);

  const isAuthor = sameId(comment.author, userId);
  const isPostAuthor = sameId(post.author, userId);
  const isGroupAdmin = Boolean(post.group) && includesId(post.group.admins, userId);
  if (!isAuthor && !isPostAuthor && !isGroupAdmin) {
    throw HttpError.forbidden('You can only delete your own comments');
  }

  await comment.deleteOne();
  res.status(204).end();
}
