import { Router } from 'express';
import * as auth from '../../controllers/authController.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema, registerSchema } from '../../validators/userSchemas.js';

const router = Router();

router.post('/register', validate({ body: registerSchema }), auth.register);
router.post('/login', validate({ body: loginSchema }), auth.login);
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);

export default router;
