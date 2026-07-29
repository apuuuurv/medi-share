import { Router } from 'express';
import {
  createWarehouse,
  getAllWarehouses,
  createMaintenanceLog,
  updateMaintenanceStatus,
} from '../controllers/warehouseController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = Router();

// Hub Management
router.post('/', authenticateJWT, authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), createWarehouse);
router.get('/', authenticateJWT, getAllWarehouses);

// Maintenance Management
router.post('/maintenance', authenticateJWT, authorizeRoles(UserRole.NGO_ADMIN, UserRole.VOLUNTEER, UserRole.SUPER_ADMIN), createMaintenanceLog);
router.patch('/maintenance/:id', authenticateJWT, authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN), updateMaintenanceStatus);

export default router;