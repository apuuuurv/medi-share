import { Router } from 'express';
import { 
  createRequest, 
  getPriorityRequests, 
  getMyRequests,
  approveAndMatchRequest 
} from '../controllers/requestController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = Router();

// Beneficiary Submit Request
router.post(
  '/', 
  authenticateJWT, 
  authorizeRoles(UserRole.BENEFICIARY, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  createRequest
);

// Beneficiary My Requests View
router.get(
  '/my-requests', 
  authenticateJWT, 
  authorizeRoles(UserRole.BENEFICIARY, UserRole.SUPER_ADMIN), 
  getMyRequests
);

// List requests sorted by urgency score (NGO & Admins)
router.get(
  '/', 
  authenticateJWT, 
  authorizeRoles(UserRole.NGO_ADMIN, UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), 
  getPriorityRequests
);

// NGO Match, Reserve Equipment & Auto-Spawn Logistics Task
router.patch(
  '/:id/approve', 
  authenticateJWT, 
  authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  approveAndMatchRequest
);

export default router;