import { Router } from 'express';
import * as stats from '../../controllers/statsController.js';
import { validate } from '../../middleware/validate.js';
import { membersPerGroupQuery, postsPerMonthQuery } from '../../validators/statsSchemas.js';

const router = Router();

router.get('/posts-per-month', validate({ query: postsPerMonthQuery }), stats.postsPerMonth);
router.get('/posts-per-category', stats.postsPerCategory);
router.get('/members-per-group', validate({ query: membersPerGroupQuery }), stats.membersPerGroup);

export default router;
