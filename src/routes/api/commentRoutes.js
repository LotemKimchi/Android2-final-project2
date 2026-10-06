import { Router } from 'express';
import * as comments from '../../controllers/commentController.js';
import { validate } from '../../middleware/validate.js';
import { updateCommentSchema } from '../../validators/commentSchemas.js';
import { idParams } from '../../validators/common.js';

// Listing and creating live under /api/posts/:id/comments — see postRoutes.js.
const router = Router();

router.patch(
  '/:id',
  validate({ params: idParams, body: updateCommentSchema }),
  comments.updateComment,
);
router.delete('/:id', validate({ params: idParams }), comments.deleteComment);

export default router;
