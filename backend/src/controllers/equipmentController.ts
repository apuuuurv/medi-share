import { Response } from 'express';
import { QueryFilter, Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { EquipmentModel, IEquipment } from '../models/Equipment.js';
import { EquipmentHistoryModel, IEquipmentHistory } from '../models/EquipmentHistory.js';
import { EquipmentStatus } from '../constants/enums.js';
import { generateQRCodeDataURI } from '../services/qrService.js';
import { validateStateTransition } from '../services/fsmService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// 1. Submit New Equipment Donation
export const createEquipment = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { name, category, description, condition, donationType, purchaseYear, specifications, location, media } = req.body;
    const donorId = req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined;

    if (!donorId) {
      return sendError(res, 401, 'Unauthorized');
    }

    const uniqueCode = `MED-EQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const qrCodeUrl = await generateQRCodeDataURI(uniqueCode);

    const equipment = await EquipmentModel.create({
      assetId: uniqueCode,
      qrCodeUrl,
      name,
      category,
      description,
      donorId,
      condition,
      donationType,
      status: EquipmentStatus.DONATION_SUBMITTED,
      purchaseYear,
      specifications: specifications || {},
      location: location || { type: 'Point', coordinates: [72.8777, 19.0760] },
      media: media || [],
    });

    // Record initial history log
    await EquipmentHistoryModel.create({
      equipmentId: equipment._id,
      fromStatus: EquipmentStatus.DONATION_SUBMITTED,
      toStatus: EquipmentStatus.DONATION_SUBMITTED,
      actorId: donorId,
      remarks: 'Donation submitted by donor.',
    });

    return sendSuccess(res, 201, 'Equipment donation submitted successfully', equipment);
  } catch (error) {
    return sendError(res, 500, 'Failed to submit equipment donation', error);
  }
};

// 2. Fetch All Equipment with Filters & Search
export const getEquipmentList = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { status, category, search } = req.query;
    const query: QueryFilter<IEquipment> = {};

    if (typeof status === 'string') query.status = status as EquipmentStatus;
    if (typeof category === 'string') query.category = category;
    if (typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetId: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await EquipmentModel.find(query)
      .populate('donorId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Equipment list retrieved successfully', items);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve equipment', error);
  }
};

// 3. Scan QR Code or Lookup by Asset ID
export const getEquipmentByAssetId = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { assetId } = req.params;
    const equipment = await EquipmentModel.findOne({ assetId })
      .populate('donorId', 'firstName lastName email phone');

    if (!equipment) {
      return sendError(res, 404, 'Equipment not found with provided Asset ID');
    }

    const historyFilter: QueryFilter<IEquipmentHistory> = { equipmentId: equipment._id };
    const history = await EquipmentHistoryModel.find(historyFilter)
      .populate('actorId', 'firstName lastName role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Equipment details retrieved', { equipment, history });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve equipment details', error);
  }
};

// 4. Update Equipment State via FSM Engine
export const updateEquipmentStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { newStatus, remarks } = req.body;
    const actorId = req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined;

    if (!actorId) {
      return sendError(res, 401, 'Unauthorized');
    }

    const equipment = await EquipmentModel.findById(id);
    if (!equipment) {
      return sendError(res, 404, 'Equipment not found');
    }

    const isValid = validateStateTransition(equipment.status, newStatus as EquipmentStatus);
    if (!isValid) {
      return sendError(
        res,
        400,
        `Invalid FSM Transition: Cannot shift status from '${equipment.status}' to '${newStatus}'`
      );
    }

    const previousStatus = equipment.status;
    equipment.status = newStatus as EquipmentStatus;
    await equipment.save();

    await EquipmentHistoryModel.create({
      equipmentId: equipment._id,
      fromStatus: previousStatus,
      toStatus: newStatus,
      actorId,
      remarks: remarks || `Status transition to ${newStatus}`,
    });

    return sendSuccess(res, 200, `Equipment status updated to ${newStatus}`, equipment);
  } catch (error) {
    return sendError(res, 500, 'Failed to update status', error);
  }
};