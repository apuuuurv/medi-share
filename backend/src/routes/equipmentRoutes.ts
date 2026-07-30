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

// 1. Retrieve equipment inventory
router.get('/', authenticateJWT, getEquipmentList);

// 2. Lookup/Scan by Asset ID (QR Code lookup)
router.get('/scan/:assetId', authenticateJWT, getEquipmentByAssetId);
router.get('/:assetId', authenticateJWT, getEquipmentByAssetId);

// 3. Submit new donation
router.post(
  '/', 
  authenticateJWT, 
  authorizeRoles(UserRole.DONOR, UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), 
  createEquipment
);

// 4. State transitions (NGO Admin, Volunteers, Super Admin)
router.patch(
  '/:id/status', 
  authenticateJWT, 
  authorizeRoles(UserRole.NGO_ADMIN, UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), 
  updateEquipmentStatus
);

export default router;