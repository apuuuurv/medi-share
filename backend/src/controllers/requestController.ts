import { Response } from 'express';
import { QueryFilter, Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { RequestModel, IRequest } from '../models/Request.js';
import { EquipmentModel } from '../models/Equipment.js';
import { RequestStatus, EquipmentStatus } from '../constants/enums.js';
import { calculateUrgencyScore } from '../services/urgencyEngine.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// 1. Submit a New Beneficiary Request
export const createRequest = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const beneficiaryId = req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined;
    const { equipmentCategory, prescriptionUrl, doctorName, hospitalName, diagnosis, urgencyLevel, deliveryAddress } = req.body;

    if (!beneficiaryId) {
      return sendError(res, 401, 'Unauthorized');
    }

    // Calculate urgency score
    const calculatedUrgencyScore = calculateUrgencyScore({
      urgencyLevel,
      equipmentCategory,
      hasValidPrescription: Boolean(prescriptionUrl),
    });

    const request = await RequestModel.create({
      beneficiaryId,
      equipmentCategory,
      prescriptionUrl,
      doctorName,
      hospitalName,
      diagnosis,
      urgencyLevel,
      calculatedUrgencyScore,
      deliveryAddress,
      status: RequestStatus.SUBMITTED,
    });

    return sendSuccess(res, 201, 'Equipment request submitted successfully', request);
  } catch (error) {
    return sendError(res, 500, 'Failed to submit request', error);
  }
};

// 2. Fetch Priority Requests List (Sorted by Urgency Score)
export const getPriorityRequests = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { status, category } = req.query;
    const query: QueryFilter<IRequest> = {};

    if (typeof status === 'string') query.status = status as RequestStatus;
    if (typeof category === 'string') query.equipmentCategory = category;

    // High urgency score comes first!
    const requests = await RequestModel.find(query)
      .populate('beneficiaryId', 'firstName lastName email phone')
      .populate('assignedEquipmentId', 'name assetId status')
      .sort({ calculatedUrgencyScore: -1, createdAt: 1 });

    return sendSuccess(res, 200, 'Priority requests retrieved successfully', requests);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch requests', error);
  }
};

// 3. NGO Approval & Equipment Matching
export const approveAndMatchRequest = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { equipmentId, notes } = req.body;

    const request = await RequestModel.findById(id);
    if (!request) {
      return sendError(res, 404, 'Beneficiary request not found');
    }

    const equipment = await EquipmentModel.findById(equipmentId);
    if (!equipment) {
      return sendError(res, 404, 'Equipment item not found');
    }

    if (equipment.status !== EquipmentStatus.IN_INVENTORY) {
      return sendError(res, 400, `Equipment is not available for reservation (Current Status: ${equipment.status})`);
    }

    // Transition equipment status to RESERVED
    equipment.status = EquipmentStatus.RESERVED;
    equipment.currentHolderId = request.beneficiaryId;
    await equipment.save();

    // Update request details
    request.status = RequestStatus.APPROVED;
    request.assignedEquipmentId = equipment._id;
    request.fulfillmentNotes = notes || 'Request approved and equipment reserved for dispatch.';
    await request.save();

    return sendSuccess(res, 200, 'Request approved and equipment assigned successfully', {
      request,
      equipment,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to approve request', error);
  }
};