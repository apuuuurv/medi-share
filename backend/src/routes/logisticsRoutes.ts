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

// 1. Create Task (NGO / Super Admin)
router.post(
  '/', 
  authenticateJWT, 
  authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  createLogisticsTask
);

// 2. View Available Tasks (Volunteers, NGO Admins & Super Admins)
router.get(
  '/available', 
  authenticateJWT, 
  authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  getAvailableTasks
);

// 3. View Volunteer's Assigned Tasks (Allowed for NGO_ADMIN as well for easy testing)
router.get(
  '/my-tasks', 
  authenticateJWT, 
  authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  getMyTasks
);

// 4. Single Task Details
router.get(
  '/:id', 
  authenticateJWT, 
  authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  getTaskById
);

// 5. Accept Task (Matches POST method used in frontend)
router.post(
  '/:id/accept', 
  authenticateJWT, 
  authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  acceptTask
);

// 6. Complete Task with OTP (Matches /complete-otp route used in frontend)
router.post(
  '/:id/complete-otp', 
  authenticateJWT, 
  authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  completeTaskWithOTP
);

// 7. Manual Task Status Update
router.patch(
  '/:id/status', 
  authenticateJWT, 
  authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  updateTaskStatus
);

// 8. Live GPS Location Update (Supports both POST & PATCH for safety)
router.post(
  '/:id/location', 
  authenticateJWT, 
  authorizeRoles(UserRole.VOLUNTEER, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  updateTaskLocation
);

export default router;