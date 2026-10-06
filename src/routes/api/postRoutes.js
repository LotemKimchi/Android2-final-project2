import { Router } from 'express';
import * as posts from '../../controllers/postController.js';
import { uploadPostMedia } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { idParams } from '../../validators/common.js';
import {
  createPostSchema,
  listPostsQuery,
  postSearchQuery,
  updatePostSchema,
} from '../../validators/postSchemas.js';

const router = Router();
const withId = validate({ params: idParams });

router.get('/feed', validate({ query: listPostsQuery }), posts.getFeed);
router.get('/mine', validate({ query: listPostsQuery }), posts.getMyPosts);
router.get('/', validate({ query: postSearchQuery }), posts.searchPosts);
router.post('/', uploadPostMedia, validate({ body: createPostSchema }), posts.createPost);

router.get('/:id', withId, posts.getPost);
// Validate the id before accepting uploads so a bad URL never stores a file.
router.patch(
  '/:id',
  withId,
  uploadPostMedia,
  validate({ body: updatePostSchema }),
  posts.updatePost,
);
router.delete('/:id', withId, posts.deletePost);
router.post('/:id/like', withId, posts.likePost);
router.delete('/:id/like', withId, posts.unlikePost);

export default router;
