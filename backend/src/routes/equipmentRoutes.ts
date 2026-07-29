import { Router } from 'express';
import { 
  createEquipment, 
  getEquipmentList, 
  getEquipmentByAssetId, 
  updateEquipmentStatus 
} from '../controllers/equipmentController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = Router();

// Public / Authenticated endpoints
router.get('/', authenticateJWT, getEquipmentList);
router.get('/:assetId', authenticateJWT, getEquipmentByAssetId);

// Donor & NGO permissions
router.post('/', authenticateJWT, authorizeRoles(UserRole.DONOR, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), createEquipment);

// State transitions (NGO Admin, Volunteers, Super Admin)
router.patch('/:id/status', authenticateJWT, authorizeRoles(UserRole.NGO_ADMIN, UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), updateEquipmentStatus);

export default router;