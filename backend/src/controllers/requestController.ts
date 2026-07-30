import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { RequestModel } from '../models/Request.js';
import { EquipmentModel } from '../models/Equipment.js';
import { LogisticsTaskModel, TaskType, TaskStatus } from '../models/LogisticsTask.js';
import { UserModel } from '../models/User.js';
import { RequestStatus, EquipmentStatus } from '../constants/enums.js';
import { calculateUrgencyScore } from '../services/urgencyEngine.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { sendOtpEmail } from '../services/emailService.js';

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. Submit a New Beneficiary Request
export const createRequest = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const beneficiaryIdStr = req.user?.userId;
    if (!beneficiaryIdStr) {
      return sendError(res, 401, 'Unauthorized');
    }

    const beneficiaryId = new Types.ObjectId(beneficiaryIdStr);
    const { 
      equipmentCategory, 
      prescriptionUrl, 
      doctorName, 
      hospitalName, 
      diagnosis, 
      urgencyLevel, 
      deliveryAddress 
    } = req.body;

    // Calculate urgency score using the urgency engine
    const calculatedUrgencyScore = calculateUrgencyScore({
      urgencyLevel,
      equipmentCategory,
      hasValidPrescription: Boolean(prescriptionUrl),
    });

    const request = await RequestModel.create({
      beneficiaryId: beneficiaryId as any,
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
    const query: Record<string, any> = {};

    if (typeof status === 'string') query.status = status;
    if (typeof category === 'string') query.equipmentCategory = category;

    // High urgency score comes first!
    const requests = await RequestModel.find(query)
      .populate('beneficiaryId', 'fullName firstName lastName email phone')
      .populate('assignedEquipmentId', 'name assetId status')
      .sort({ calculatedUrgencyScore: -1, createdAt: 1 });

    return sendSuccess(res, 200, 'Priority requests retrieved successfully', requests);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch requests', error);
  }
};

// 3. Fetch Personal Requests for Logged-in Beneficiary
export const getMyRequests = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const beneficiaryIdStr = req.user?.userId;
    if (!beneficiaryIdStr) return sendError(res, 401, 'Unauthorized');

    const requests = await RequestModel.find({
      beneficiaryId: new Types.ObjectId(beneficiaryIdStr) as any,
    })
      .populate('assignedEquipmentId', 'name assetId status')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Your requests fetched successfully', requests);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch personal requests', error);
  }
};

// 4. NGO Approval, Equipment Matching & Auto-Dispatch Task Creation
export const approveAndMatchRequest = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { equipmentId, pickupAddress, notes } = req.body;

    const request = await RequestModel.findById(id);
    if (!request) {
      return sendError(res, 404, 'Beneficiary request not found');
    }

    const equipment = await EquipmentModel.findById(equipmentId);
    if (!equipment) {
      return sendError(res, 404, 'Equipment item not found');
    }

    if (
      equipment.status !== EquipmentStatus.IN_INVENTORY && 
      equipment.status !== EquipmentStatus.AVAILABLE
    ) {
      return sendError(res, 400, `Equipment is not available for reservation (Current Status: ${equipment.status})`);
    }

    // Transition equipment status to RESERVED
    equipment.status = EquipmentStatus.RESERVED;
    equipment.currentHolderId = request.beneficiaryId as any;
    await equipment.save();

    // Update request details
    request.status = RequestStatus.APPROVED;
    request.assignedEquipmentId = equipment._id as any;
    request.fulfillmentNotes = notes || 'Request approved and equipment reserved for dispatch.';
    await request.save();

    // Generate Handover OTP Code
    const handoverOtp = generateOTP();

    // Auto-create DELIVER_TO_BENEFICIARY logistics task
    const task = await LogisticsTaskModel.create({
      taskType: TaskType.DELIVER_TO_BENEFICIARY,
      equipmentId: equipment._id as any,
      requestId: request._id as any,
      pickupAddress: pickupAddress || {
        street: 'Central NGO Warehouse',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        location: { type: 'Point', coordinates: [72.8777, 19.0760] },
      },
      dropoffAddress: request.deliveryAddress || {
        street: 'Beneficiary Residence',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        location: { type: 'Point', coordinates: [0, 0] },
      },
      handoverOtp,
      status: TaskStatus.UNASSIGNED,
    });

    // Send OTP email notification to the beneficiary
    const beneficiary = await UserModel.findById(request.beneficiaryId);
    if (beneficiary?.email) {
      sendOtpEmail(beneficiary.email, handoverOtp, TaskType.DELIVER_TO_BENEFICIARY).catch((err) =>
        console.error('Failed to trigger beneficiary OTP email:', err)
      );
    }

    return sendSuccess(res, 200, 'Request approved, equipment reserved, and dispatch task created!', {
      request,
      equipment,
      logisticsTask: task,
      otpCode: handoverOtp,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to approve request', error);
  }
};