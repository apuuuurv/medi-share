import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { WarehouseModel } from '../models/Warehouse.js';
import { MaintenanceLogModel, MaintenanceStatus } from '../models/MaintenanceLog.js';
import { EquipmentModel } from '../models/Equipment.js';
import { EquipmentStatus } from '../constants/enums.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// 1. Create a Warehouse Hub
export const createWarehouse = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { name, code, address, totalCapacity } = req.body;
    const managerIdStr = req.user?.userId;

    if (!managerIdStr) {
      return sendError(res, 401, 'Unauthorized');
    }

    const managerId = new Types.ObjectId(managerIdStr);

    const existingCode = await WarehouseModel.findOne({ code });
    if (existingCode) {
      return sendError(res, 400, 'Warehouse with this code already exists');
    }

    const warehouse = await WarehouseModel.create({
      name,
      code,
      managerId: managerId as any,
      address,
      totalCapacity: totalCapacity || 100,
    });

    return sendSuccess(res, 201, 'Warehouse hub created successfully', warehouse);
  } catch (error) {
    return sendError(res, 500, 'Failed to create warehouse hub', error);
  }
};

// 2. Fetch All Warehouses with Current Stock Aggregation
export const getAllWarehouses = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const warehouses = await WarehouseModel.find().populate('managerId', 'fullName email phone');

    // Aggregate current stored inventory count for each warehouse
    const warehousesWithStock = await Promise.all(
      warehouses.map(async (wh) => {
        const currentStock = await EquipmentModel.countDocuments({
          warehouseId: wh._id,
        });
        return {
          ...wh.toObject(),
          currentStock,
          availableSpace: Math.max(0, (wh.totalCapacity || 100) - currentStock),
        };
      })
    );

    return sendSuccess(res, 200, 'Warehouses fetched successfully', warehousesWithStock);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch warehouses', error);
  }
};

// 3. Fetch Single Warehouse Details by ID
export const getWarehouseById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const id = req.params.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid warehouse ID format');
    }

    const warehouse = await WarehouseModel.findById(id).populate('managerId', 'fullName email phone');
    if (!warehouse) {
      return sendError(res, 404, 'Warehouse not found');
    }

    const currentStock = await EquipmentModel.countDocuments({
      warehouseId: new Types.ObjectId(id),
    });

    return sendSuccess(res, 200, 'Warehouse details retrieved successfully', {
      warehouse,
      currentStock,
      availableSpace: Math.max(0, (warehouse.totalCapacity || 100) - currentStock),
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch warehouse details', error);
  }
};

// 4. Log Equipment Maintenance / Sanitization
export const createMaintenanceLog = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { equipmentId, warehouseId, type, notes, cost } = req.body;
    const performedByStr = req.user?.userId;

    if (!performedByStr) {
      return sendError(res, 401, 'Unauthorized');
    }

    const performedBy = new Types.ObjectId(performedByStr);

    const log = await MaintenanceLogModel.create({
      equipmentId: new Types.ObjectId(equipmentId as string) as any,
      warehouseId: warehouseId ? (new Types.ObjectId(warehouseId as string) as any) : undefined,
      performedBy: performedBy as any,
      type,
      notes,
      cost,
      status: MaintenanceStatus.IN_PROGRESS,
    });

    // Temporarily update equipment status to UNDER_MAINTENANCE
    await EquipmentModel.findByIdAndUpdate(equipmentId, {
      status: EquipmentStatus.UNDER_MAINTENANCE,
    });

    return sendSuccess(res, 201, 'Maintenance log created successfully', log);
  } catch (error) {
    return sendError(res, 500, 'Failed to create maintenance log', error);
  }
};

// 5. Update Maintenance Status (Pass/Fail Inspection & Auto-Sync Equipment Status)
export const updateMaintenanceStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const id = req.params.id as string;
    const { status, notes } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid maintenance log ID format');
    }

    const log = await MaintenanceLogModel.findById(id);
    if (!log) return sendError(res, 404, 'Maintenance log not found');

    log.status = status;
    if (notes) log.notes = notes;

    if (status === MaintenanceStatus.PASSED || status === MaintenanceStatus.FAILED) {
      log.completedAt = new Date();

      // If passed, return equipment to inventory; if failed, mark as under maintenance
      const targetEquipmentStatus =
        status === MaintenanceStatus.PASSED
          ? EquipmentStatus.IN_INVENTORY
          : EquipmentStatus.UNDER_MAINTENANCE;

      await EquipmentModel.findByIdAndUpdate(log.equipmentId, {
        status: targetEquipmentStatus,
      });
    }

    await log.save();
    return sendSuccess(res, 200, 'Maintenance status updated successfully', log);
  } catch (error) {
    return sendError(res, 500, 'Failed to update maintenance log', error);
  }
};