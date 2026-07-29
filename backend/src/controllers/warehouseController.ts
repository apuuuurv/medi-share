import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { WarehouseModel } from '../models/Warehouse.js';
import { MaintenanceLogModel, MaintenanceStatus } from '../models/MaintenanceLog.js';
import { EquipmentModel } from '../models/Equipment.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// 1. Create a Warehouse Hub
export const createWarehouse = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, address, totalCapacity } = req.body;
    const managerId = req.user?.userId;

    const warehouse = await WarehouseModel.create({
      name,
      code,
      managerId: managerId as any,
      address,
      totalCapacity,
    });

    return sendSuccess(res, 201, 'Warehouse hub created successfully', warehouse);
  } catch (error) {
    return sendError(res, 500, 'Failed to create warehouse hub', error);
  }
};

// 2. Fetch All Warehouses with Current Stock Count
export const getAllWarehouses = async (req: AuthRequest, res: Response) => {
  try {
    const warehouses = await WarehouseModel.find().populate('managerId', 'fullName email');
    return sendSuccess(res, 200, 'Warehouses fetched successfully', warehouses);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch warehouses', error);
  }
};

// 3. Log Equipment Maintenance / Sanitization
export const createMaintenanceLog = async (req: AuthRequest, res: Response) => {
  try {
    const { equipmentId, warehouseId, type, notes, cost } = req.body;
    const performedBy = req.user?.userId;

    const log = await MaintenanceLogModel.create({
      equipmentId: equipmentId as any,
      warehouseId: warehouseId as any,
      performedBy: performedBy as any,
      type,
      notes,
      cost,
    });

    return sendSuccess(res, 201, 'Maintenance log created', log);
  } catch (error) {
    return sendError(res, 500, 'Failed to create maintenance log', error);
  }
};

// 4. Update Maintenance Status (Pass/Fail Inspection)
export const updateMaintenanceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const log = await MaintenanceLogModel.findById(id);
    if (!log) return sendError(res, 404, 'Maintenance log not found');

    log.status = status;
    if (notes) log.notes = notes;
    if (status === MaintenanceStatus.PASSED || status === MaintenanceStatus.FAILED) {
      log.completedAt = new Date();
    }

    await log.save();
    return sendSuccess(res, 200, 'Maintenance status updated', log);
  } catch (error) {
    return sendError(res, 500, 'Failed to update maintenance log', error);
  }
};