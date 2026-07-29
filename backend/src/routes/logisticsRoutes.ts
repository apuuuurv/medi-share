import { Router } from 'express';
import { 
  createLogisticsTask, 
  getAvailableTasks, 
  acceptTask, 
  completeTaskWithOTP 
} from '../controllers/logisticsController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = Router();

// Create Task (NGO / Super Admin)
router.post('/', authenticateJWT, authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), createLogisticsTask);

// View Available Tasks (Volunteers & Admins)
router.get('/available', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), getAvailableTasks);

// Accept Task (Volunteers)
router.patch('/:id/accept', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), acceptTask);

// Complete Task with OTP (Volunteers)
router.post('/:id/verify-otp', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), completeTaskWithOTP);

export default router;