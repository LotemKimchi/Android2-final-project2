import { Router } from 'express';
import { renderPage } from '../controllers/pageController.js';
import { GROUP_CATEGORIES } from '../models/Group.js';
import { requireGuestPage, requirePageAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';

const router = Router();

router.get('/', (req, res) => res.redirect(req.user ? '/feed' : '/login'));
router.get('/login', requireGuestPage, renderPage('login', 'Log in'));
router.get('/register', requireGuestPage, renderPage('register', 'Sign up'));
router.get('/friends', requirePageAuth, renderPage('friends', 'Friends'));
router.get('/users', requirePageAuth, renderPage('users', 'People'));
router.get(
  '/users/:id',
  requirePageAuth,
  validate({ params: idParams }),
  renderPage('profile', 'Profile', (req) => ({
    pageData: { 'profile-id': req.valid.params.id, self: req.valid.params.id === req.user.id },
  })),
);
router.get('/feed', requirePageAuth, renderPage('feed', 'Feed'));
router.get(
  '/chat',
  requirePageAuth,
  renderPage('chat', 'Chat', (req) => ({ pageData: { 'user-id': req.user.id } })),
);
router.get('/me/posts', requirePageAuth, renderPage('myPosts', 'My posts'));
router.get('/posts/search', requirePageAuth, renderPage('postSearch', 'Search posts'));
router.get('/settings', requirePageAuth, renderPage('settings', 'Settings'));
router.get('/stats', requirePageAuth, renderPage('stats', 'Statistics'));
router.get(
  '/groups',
  requirePageAuth,
  renderPage('groups', 'Groups', () => ({ categories: GROUP_CATEGORIES })),
);
router.get(
  '/groups/:id',
  requirePageAuth,
  validate({ params: idParams }),
  renderPage('group', 'Group', (req) => ({
    categories: GROUP_CATEGORIES,
    pageData: { 'group-id': req.valid.params.id },
  })),
);

export default router;
