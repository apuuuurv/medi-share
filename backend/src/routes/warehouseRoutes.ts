import { Router } from 'express';
import {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  createMaintenanceLog,
  updateMaintenanceStatus,
} from '../controllers/warehouseController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

const router = Router();

/**
 * @openapi
 * /warehouses:
 *   get:
 *     summary: Retrieve all active warehouses with current stock levels
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of warehouses retrieved successfully with capacity details
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateJWT, getAllWarehouses);

/**
 * @openapi
 * /warehouses/{id}:
 *   get:
 *     summary: Get single warehouse details and stock stats by ID
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Warehouse MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Warehouse details fetched successfully
 *       400:
 *         description: Invalid warehouse ID format
 *       404:
 *         description: Warehouse not found
 */
router.get('/:id', authenticateJWT, getWarehouseById);

/**
 * @openapi
 * /warehouses:
 *   post:
 *     summary: Register a new warehouse hub
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Central Medical Depot
 *               code:
 *                 type: string
 *                 example: WH-MUM-001
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: 45 Logistics Way
 *                   city:
 *                     type: string
 *                     example: Mumbai
 *                   state:
 *                     type: string
 *                     example: Maharashtra
 *                   zipCode:
 *                     type: string
 *                     example: 400001
 *               totalCapacity:
 *                 type: number
 *                 example: 250
 *     responses:
 *       201:
 *         description: Warehouse hub created successfully
 *       400:
 *         description: Warehouse code already exists
 */
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN),
  createWarehouse
);

/**
 * @openapi
 * /warehouses/maintenance:
 *   post:
 *     summary: Create a maintenance or sanitization log for equipment
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [equipmentId, type]
 *             properties:
 *               equipmentId:
 *                 type: string
 *                 example: 66a1b2c3d4e5f67890123456
 *               warehouseId:
 *                 type: string
 *                 example: 66a987654321fedcba098765
 *               type:
 *                 type: string
 *                 example: SANITIZATION
 *               notes:
 *                 type: string
 *                 example: Routinely disinfected oxygen concentrator prior to reallocation.
 *               cost:
 *                 type: number
 *                 example: 50
 *     responses:
 *       201:
 *         description: Maintenance log created successfully and equipment set to UNDER_MAINTENANCE
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/maintenance',
  authenticateJWT,
  authorizeRoles(UserRole.NGO_ADMIN, UserRole.VOLUNTEER, UserRole.SUPER_ADMIN),
  createMaintenanceLog
);

/**
 * @openapi
 * /warehouses/maintenance/{id}:
 *   patch:
 *     summary: Update maintenance status (Pass/Fail Inspection & sync equipment status)
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance Log ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IN_PROGRESS, PASSED, FAILED]
 *                 example: PASSED
 *               notes:
 *                 type: string
 *                 example: Inspection completed. All vital checks passed successfully.
 *     responses:
 *       200:
 *         description: Maintenance status updated and equipment returned to available status
 *       404:
 *         description: Maintenance log not found
 */
router.patch(
  '/maintenance/:id',
  authenticateJWT,
  authorizeRoles(UserRole.NGO_ADMIN, UserRole.SUPER_ADMIN),
  updateMaintenanceStatus
);

export default router;