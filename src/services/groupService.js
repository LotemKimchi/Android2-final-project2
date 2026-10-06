import { Post } from '../models/Post.js';
import { deleteUploadsByUrl } from '../utils/files.js';

/** Deletes a group together with its posts and their media files. */
export async function deleteGroupCascade(group) {
  const posts = await Post.find({ group: group._id }).select('imageUrl videoUrl').lean();
  await Post.deleteMany({ group: group._id });
  await group.deleteOne();
  await deleteUploadsByUrl(posts.flatMap((post) => [post.imageUrl, post.videoUrl]));
}
