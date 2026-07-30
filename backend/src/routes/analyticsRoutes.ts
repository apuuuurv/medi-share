import { Router } from 'express';
import { getDashboardOverview } from '../controllers/analyticsController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = Router();

// NGO Admin & Super Admin Dashboard Route
router.get('/dashboard', authenticateJWT, authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), getDashboardOverview);

export default router;