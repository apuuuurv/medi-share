import { Router } from 'express';
import { 
  createRequest, 
  getPriorityRequests, 
  approveAndMatchRequest 
} from '../controllers/requestController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = Router();

// Beneficiary / Doctor Submit Request
router.post('/', authenticateJWT, createRequest);

// List requests sorted by urgency (NGO & Admins)
router.get('/', authenticateJWT, authorizeRoles(UserRole.NGO_ADMIN, UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), getPriorityRequests);

// NGO Match & Approve Request
router.patch('/:id/approve', authenticateJWT, authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), approveAndMatchRequest);

export default router;