import { Router } from 'express';
import { 
  createLogisticsTask, 
  getAvailableTasks, 
  acceptTask, 
  completeTaskWithOTP,
  getMyTasks,
  getTaskById,
  updateTaskStatus,
  updateTaskLocation
} from '../controllers/logisticsController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = Router();

// Create Task (NGO / Super Admin)
router.post('/', authenticateJWT, authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), createLogisticsTask);

// View Available Tasks (Volunteers & Admins)
router.get('/available', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), getAvailableTasks);

// View Volunteer's Assigned Tasks (Volunteers & Admins)
router.get('/my-tasks', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), getMyTasks);

// Single Task Details (Volunteers & Admins)
router.get('/:id', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), getTaskById);

// Accept Task (Volunteers)
router.patch('/:id/accept', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), acceptTask);

// Manual Task Status Update (Volunteers & Admins)
router.patch('/:id/status', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), updateTaskStatus);

// Complete Task with OTP (Volunteers)
router.post('/:id/verify-otp', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), completeTaskWithOTP);

// Live GPS Location Update (Volunteers)
router.patch('/:id/location', authenticateJWT, authorizeRoles(UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), updateTaskLocation);

export default router;