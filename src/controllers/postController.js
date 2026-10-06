import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { toPost } from '../presenters/postPresenter.js';
import { findGroupOr404, isMember } from '../services/groupAccess.js';
import { feedFilter, visiblePostsFilter } from '../services/postAccess.js';
import { findPostsPage, findPostWithRelations, findVisiblePost } from '../services/postQueries.js';
import { addDays } from '../utils/dates.js';
import { deleteUploadsByUrl, toPublicUrl } from '../utils/files.js';
import { HttpError } from '../utils/HttpError.js';
import { includesId, sameId } from '../utils/ids.js';
import { compact } from '../utils/objects.js';
import { containsRegex } from '../utils/regex.js';

const MEDIA_FILTERS = {
  any: { $or: [{ imageUrl: { $ne: '' } }, { videoUrl: { $ne: '' } }] },
  image: { imageUrl: { $ne: '' } },
  video: { videoUrl: { $ne: '' } },
  none: { imageUrl: '', videoUrl: '' },
};

async function buildSearchConditions({ q, authorName, authorId, groupId, from, to, media }) {
  const conditions = [];
  if (q) conditions.push({ content: containsRegex(q) });
  if (authorId) conditions.push({ author: authorId });
  if (authorName) {
    const matcher = containsRegex(authorName);
    const authorIds = await User.distinct('_id', {
      $or: [{ username: matcher }, { displayName: matcher }],
    });
    conditions.push({ author: { $in: authorIds } });
  }
  if (groupId) conditions.push({ group: groupId });
  if (from || to) {
    // "to" is a calendar day → include the whole day.
    conditions.push({ createdAt: compact({ $gte: from, $lt: to && addDays(to, 1) }) });
  }
  if (media) conditions.push(MEDIA_FILTERS[media]);
  return conditions;
}

const uploadedFile = (req, field) => req.files?.[field]?.[0];

export async function getFeed(req, res) {
  const filter = await feedFilter(req.user.id);
  res.json(await findPostsPage(filter, req.valid.query, req.user.id));
}

export async function getMyPosts(req, res) {
  res.json(await findPostsPage({ author: req.user.id }, req.valid.query, req.user.id));
}

export async function searchPosts(req, res) {
  const [visibility, conditions] = await Promise.all([
    visiblePostsFilter(req.user.id),
    buildSearchConditions(req.valid.query),
  ]);
  const filter = { $and: [visibility, ...conditions] };
  res.json(await findPostsPage(filter, req.valid.query, req.user.id));
}

export async function getPost(req, res) {
  const post = await findVisiblePost(req.valid.params.id, req.user.id);
  res.json({ post: toPost(post, req.user.id) });
}

export async function createPost(req, res) {
  const userId = req.user.id;
  const { content, groupId } = req.valid.body;
  if (groupId) {
    const group = await findGroupOr404(groupId);
    if (!isMember(group, userId)) throw HttpError.forbidden('Only members can post in this group');
  }

  const post = await Post.create({
    author: userId,
    group: groupId ?? null,
    content,
    imageUrl: toPublicUrl(uploadedFile(req, 'image')),
    videoUrl: toPublicUrl(uploadedFile(req, 'video')),
  });
  const created = await findVisiblePost(post._id, userId);
  res.status(201).json({ post: toPost(created, userId) });
}

export async function updatePost(req, res) {
  const userId = req.user.id;
  const post = await Post.findById(req.valid.params.id);
  if (!post) throw HttpError.notFound('Post not found');
  if (!sameId(post.author, userId)) throw HttpError.forbidden('You can only edit your own posts');

  const { content, removeImage, removeVideo } = req.valid.body;
  const newImage = uploadedFile(req, 'image');
  const newVideo = uploadedFile(req, 'video');
  const replacedFiles = [];

  if (content !== undefined) post.content = content;
  if (newImage || removeImage) {
    replacedFiles.push(post.imageUrl);
    post.imageUrl = toPublicUrl(newImage);
  }
  if (newVideo || removeVideo) {
    replacedFiles.push(post.videoUrl);
    post.videoUrl = toPublicUrl(newVideo);
  }
  post.editedAt = new Date();
  await post.save(); // model validation rejects a post left with no text and no media

  await deleteUploadsByUrl(replacedFiles);
  // Authors can always see their own posts, even after leaving a private group.
  const updated = await findPostWithRelations(post._id);
  res.json({ post: toPost(updated, userId) });
}

export async function deletePost(req, res) {
  const userId = req.user.id;
  console.log("This is my userId: ", userId);
  const post = await Post.findById(req.valid.params.id).populate('group', 'admins');
  console.log("This is my post: ", post);
  if (!post) throw HttpError.notFound('Post not found');

  const isAuthor = sameId(post.author, userId);
  const isGroupAdmin = Boolean(post.group) && includesId(post.group.admins, userId);
  if (!isAuthor && !isGroupAdmin) throw HttpError.forbidden('You can only delete your own posts');

  await post.deleteOne();
  await deleteUploadsByUrl([post.imageUrl, post.videoUrl]);
  res.status(204).end();
}

async function setLike(req, res, isLiked) {
  const userId = req.user.id;
  await findVisiblePost(req.valid.params.id, userId); // enforces visibility
  const update = isLiked ? { $addToSet: { likes: userId } } : { $pull: { likes: userId } };
  const post = await Post.findByIdAndUpdate(req.valid.params.id, update, {
    new: true,
    projection: { likes: 1 },
  }).lean();
  if (!post) throw HttpError.notFound('Post not found');
  res.json({ likeCount: post.likes.length, likedByMe: isLiked });
}

export const likePost = (req, res) => setLike(req, res, true);
export const unlikePost = (req, res) => setLike(req, res, false);
