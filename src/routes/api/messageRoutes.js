import { Router } from 'express';
import * as messages from '../../controllers/messageController.js';
import { validate } from '../../middleware/validate.js';
import { idParams } from '../../validators/common.js';
import {
  conversationParams,
  conversationQuery,
  updateMessageSchema,
} from '../../validators/messageSchemas.js';

const router = Router();

router.get(
  '/with/:userId',
  validate({ params: conversationParams, query: conversationQuery }),
  messages.getConversation,
);
router.patch(
  '/:id',
  validate({ params: idParams, body: updateMessageSchema }),
  messages.updateMessage,
);
router.delete('/:id', validate({ params: idParams }), messages.deleteMessage);

export default router;
