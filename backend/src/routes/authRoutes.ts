import { Router } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticateJWT, getCurrentUser);

export default router;
