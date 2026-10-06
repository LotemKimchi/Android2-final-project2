import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import authRoutes from './authRoutes.js';
import groupRoutes from './groupRoutes.js';
import messageRoutes from './messageRoutes.js';
import postRoutes from './postRoutes.js';
import statsRoutes from './statsRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/users', requireAuth, userRoutes);
router.use('/groups', requireAuth, groupRoutes);
router.use('/posts', requireAuth, postRoutes);
router.use('/messages', requireAuth, messageRoutes);
router.use('/stats', requireAuth, statsRoutes);

export default router;
