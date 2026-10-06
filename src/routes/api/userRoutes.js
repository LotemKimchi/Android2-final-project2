import { Router } from 'express';
import * as friends from '../../controllers/friendController.js';
import * as users from '../../controllers/userController.js';
import { uploadAvatar } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { idParams } from '../../validators/common.js';
import {
  deleteAccountSchema,
  updateProfileSchema,
  userSearchQuery,
} from '../../validators/userSchemas.js';

const router = Router();
const withId = validate({ params: idParams });

router.get('/', validate({ query: userSearchQuery }), users.searchUsers);

// "/me/…" routes must be registered before "/:id" routes.
router.get('/me/friends', friends.listFriends);
router.get('/me/friend-requests', friends.listFriendRequests);
router.patch('/me', uploadAvatar, validate({ body: updateProfileSchema }), users.updateMe);
router.delete('/me', validate({ body: deleteAccountSchema }), users.deleteMe);

router.get('/:id', withId, users.getUser);
router.post('/:id/friend-request', withId, friends.sendRequest);
router.post('/:id/friend-request/accept', withId, friends.acceptRequest);
router.post('/:id/friend-request/decline', withId, friends.declineRequest);
router.delete('/:id/friendship', withId, friends.removeFriendship);

export default router;
