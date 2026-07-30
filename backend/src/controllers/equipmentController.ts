import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { EquipmentModel } from '../models/Equipment.js';
import { EquipmentHistoryModel } from '../models/EquipmentHistory.js';
import { EquipmentStatus } from '../constants/enums.js';
import { generateQRCodeDataURI } from '../services/qrService.js';
import { validateStateTransition } from '../services/fsmService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// 1. Submit New Equipment Donation
export const createEquipment = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { name, category, description, condition, donationType, purchaseYear, specifications, location, media } = req.body;
    const donorIdStr = req.user?.userId;

    if (!donorIdStr) {
      return sendError(res, 401, 'Unauthorized');
    }

    const donorId = new Types.ObjectId(donorIdStr);
    const uniqueCode = `MED-EQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const qrCodeUrl = await generateQRCodeDataURI(uniqueCode);

    const equipment = await EquipmentModel.create({
      assetId: uniqueCode,
      qrCodeUrl,
      name,
      category,
      description,
      donorId: donorId as any,
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
      equipmentId: equipment._id as any,
      fromStatus: EquipmentStatus.DONATION_SUBMITTED,
      toStatus: EquipmentStatus.DONATION_SUBMITTED,
      actorId: donorId as any,
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
    const query: Record<string, any> = {};

    if (typeof status === 'string') query.status = status;
    if (typeof category === 'string') query.category = category;
    if (typeof search === 'string' && search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetId: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await EquipmentModel.find(query)
      .populate('donorId', 'firstName lastName fullName email phone')
      .populate('currentHolderId', 'fullName email')
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
      .populate('donorId', 'firstName lastName fullName email phone')
      .populate('currentHolderId', 'fullName email phone');

    if (!equipment) {
      return sendError(res, 404, 'Equipment not found with provided Asset ID');
    }

    const history = await EquipmentHistoryModel.find({ equipmentId: equipment._id as any })
      .populate('actorId', 'firstName lastName fullName role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Equipment details retrieved successfully', { equipment, history });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve equipment details', error);
  }
};

// 4. Update Equipment State via FSM Engine
export const updateEquipmentStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { newStatus, remarks } = req.body;
    const actorIdStr = req.user?.userId;

    if (!actorIdStr) {
      return sendError(res, 401, 'Unauthorized');
    }

    const actorId = new Types.ObjectId(actorIdStr);

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
      equipmentId: equipment._id as any,
      fromStatus: previousStatus,
      toStatus: newStatus,
      actorId: actorId as any,
      remarks: remarks || `Status transition to ${newStatus}`,
    });

    return sendSuccess(res, 200, `Equipment status updated to ${newStatus}`, equipment);
  } catch (error) {
    return sendError(res, 500, 'Failed to update status', error);
  }
};