import { Router } from 'express';
import * as groups from '../../controllers/groupController.js';
import * as membership from '../../controllers/membershipController.js';
import { validate } from '../../middleware/validate.js';
import { idParams } from '../../validators/common.js';
import {
  createGroupSchema,
  groupSearchQuery,
  memberParams,
  updateGroupSchema,
} from '../../validators/groupSchemas.js';

const router = Router();
const withId = validate({ params: idParams });
const withMember = validate({ params: memberParams });

router.get('/', validate({ query: groupSearchQuery }), groups.searchGroups);
router.post('/', validate({ body: createGroupSchema }), groups.createGroup);
router.get('/:id', withId, groups.getGroup);
router.patch('/:id', validate({ params: idParams, body: updateGroupSchema }), groups.updateGroup);
router.delete('/:id', withId, groups.deleteGroup);

router.get('/:id/members', withId, membership.listMembers);
router.post('/:id/join', withId, membership.joinGroup);
router.delete('/:id/membership', withId, membership.leaveGroup);
router.get('/:id/requests', withId, membership.listJoinRequests);
router.post('/:id/requests/:userId/approve', withMember, membership.approveJoinRequest);
router.post('/:id/requests/:userId/decline', withMember, membership.declineJoinRequest);
router.delete('/:id/members/:userId', withMember, membership.removeMember);
router.post('/:id/admins/:userId', withMember, membership.promoteAdmin);
router.delete('/:id/admins/:userId', withMember, membership.demoteAdmin);

export default router;
