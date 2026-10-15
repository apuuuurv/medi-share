
import { Response } from 'express';
import { Types } from 'mongoose';

import { AuthRequest } from '../middlewares/authMiddleware.js';
import { RequestModel } from '../models/Request.js';
import { EquipmentModel } from '../models/Equipment.js';
import {
  LogisticsTaskModel,
  TaskType,
  TaskStatus,
} from '../models/LogisticsTask.js';
import { UserModel } from '../models/User.js';

import {
  RequestStatus,
  EquipmentStatus,
} from '../constants/enums.js';

import {
  calculateUrgencyScore,
  MedicalIndicators,
} from '../services/urgencyEngine.js';

import {
  sendSuccess,
  sendError,
} from '../utils/responseHandler.js';

import { sendOtpEmail } from '../services/emailService.js';


// Helper to generate a 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// ============================================================
// 1. SUBMIT A NEW BENEFICIARY REQUEST
// ============================================================

export const createRequest = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
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
      deliveryAddress,
      medicalIndicators,
    } = req.body;


    // --------------------------------------------------------
    // Validate required fields
    // --------------------------------------------------------

    if (!equipmentCategory || !deliveryAddress) {
      return sendError(
        res,
        400,
        'Equipment category and delivery address are required'
      );
    }


    // --------------------------------------------------------
    // Get OCR-extracted medical indicators
    // --------------------------------------------------------
    /*
      Example medicalIndicators object:

      {
        spo2: 88,
        heartRate: 110,
        temperature: 38.5,
        bloodPressure: "90/60",
        respiratoryRate: 28,
        conditions: ["shortness of breath"],
        keywords: ["oxygen support"]
      }

      These indicators should come from the OCR analysis.
    */

    const indicators: MedicalIndicators =
      medicalIndicators &&
      typeof medicalIndicators === 'object'
        ? medicalIndicators
        : {
            spo2: null,
            heartRate: null,
            temperature: null,
            bloodPressure: null,
            respiratoryRate: null,
            conditions: [],
            keywords: [],
          };


    // --------------------------------------------------------
    // AUTOMATIC URGENCY CALCULATION
    // --------------------------------------------------------
    /*
      The backend calculates urgency automatically.

      The frontend does not provide urgencyLevel.

      The urgency engine returns:
      - urgencyLevel
      - score
      - reasons
    */

    const urgencyResult = calculateUrgencyScore({
      equipmentCategory,
      hasValidPrescription: Boolean(prescriptionUrl),
      medicalIndicators: indicators,
    });


    // --------------------------------------------------------
    // Create the request in MongoDB
    // --------------------------------------------------------

    const request = await RequestModel.create({
      beneficiaryId: beneficiaryId as any,

      equipmentCategory,
      prescriptionUrl,
      doctorName,
      hospitalName,
      diagnosis,
      deliveryAddress,

      // Automatically calculated urgency values
      urgencyLevel: urgencyResult.urgencyLevel,
      calculatedUrgencyScore: urgencyResult.calculatedUrgencyScore,
      status: RequestStatus.SUBMITTED,
    });


    // --------------------------------------------------------
    // Send response
    // --------------------------------------------------------

    return sendSuccess(
      res,
      201,
      'Equipment request submitted successfully',
      {
        request,

        automaticPriority: {
          urgencyLevel: urgencyResult.urgencyLevel,
        urgencyScore: urgencyResult.calculatedUrgencyScore,
          reasons: urgencyResult.reasons,
        },
      }
    );

  } catch (error) {
    console.error('Create request error:', error);

    return sendError(
      res,
      500,
      'Failed to submit request',
      error
    );
  }
};


// ============================================================
// 2. FETCH PRIORITY REQUESTS
// ============================================================
// Requests with the highest urgency score appear first.

export const getPriorityRequests = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { status, category } = req.query;

    const query: Record<string, any> = {};

    if (typeof status === 'string') {
      query.status = status;
    }

    if (typeof category === 'string') {
      query.equipmentCategory = category;
    }


    const requests = await RequestModel.find(query)
      .populate(
        'beneficiaryId',
        'fullName firstName lastName email phone'
      )
      .populate(
        'assignedEquipmentId',
        'name assetId status'
      )
      .sort({
        calculatedUrgencyScore: -1,
        createdAt: 1,
      });


    return sendSuccess(
      res,
      200,
      'Priority requests retrieved successfully',
      requests
    );

  } catch (error) {
    console.error('Fetch priority requests error:', error);

    return sendError(
      res,
      500,
      'Failed to fetch requests',
      error
    );
  }
};


// ============================================================
// 3. FETCH PERSONAL REQUESTS
// ============================================================
// Fetch requests belonging to the logged-in beneficiary.

export const getMyRequests = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const beneficiaryIdStr = req.user?.userId;

    if (!beneficiaryIdStr) {
      return sendError(res, 401, 'Unauthorized');
    }


    const requests = await RequestModel.find({
      beneficiaryId: new Types.ObjectId(beneficiaryIdStr) as any,
    })
      .populate(
        'assignedEquipmentId',
        'name assetId status'
      )
      .sort({
        createdAt: -1,
      });


    return sendSuccess(
      res,
      200,
      'Your requests fetched successfully',
      requests
    );

  } catch (error) {
    console.error('Fetch personal requests error:', error);

    return sendError(
      res,
      500,
      'Failed to fetch personal requests',
      error
    );
  }
};


// ============================================================
// 4. NGO APPROVAL, EQUIPMENT MATCHING
//    AND AUTOMATIC DISPATCH TASK CREATION
// ============================================================

export const approveAndMatchRequest = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const {
      equipmentId,
      pickupAddress,
      notes,
    } = req.body;


    // --------------------------------------------------------
    // Validate request ID and equipment ID
    // --------------------------------------------------------

    if (!id || !equipmentId) {
      return sendError(
        res,
        400,
        'Request ID and equipment ID are required'
      );
    }


    // --------------------------------------------------------
    // Find beneficiary request
    // --------------------------------------------------------

    const request = await RequestModel.findById(id);

    if (!request) {
      return sendError(
        res,
        404,
        'Beneficiary request not found'
      );
    }


    // --------------------------------------------------------
    // Prevent duplicate approval
    // --------------------------------------------------------

    if (
      request.status === RequestStatus.APPROVED ||
      request.status === RequestStatus.ALLOCATED ||
      request.status === RequestStatus.FULFILLED ||
      request.status === RequestStatus.DELIVERED
    ) {
      return sendError(
        res,
        400,
        'This request has already been approved or fulfilled'
      );
    }


    // --------------------------------------------------------
    // Find equipment
    // --------------------------------------------------------

    const equipment = await EquipmentModel.findById(
      equipmentId
    );

    if (!equipment) {
      return sendError(
        res,
        404,
        'Equipment item not found'
      );
    }


    // --------------------------------------------------------
    // Check equipment availability
    // --------------------------------------------------------
    /*
      Only equipment already present in the inventory
      or marked available should be reserved.

      DONATION_SUBMITTED is excluded because it may
      still require verification or inspection.
    */

    if (
      equipment.status !== EquipmentStatus.IN_INVENTORY &&
      equipment.status !== EquipmentStatus.AVAILABLE
    ) {
      return sendError(
        res,
        400,
        `Equipment is not available for reservation (Current Status: ${equipment.status})`
      );
    }


    // --------------------------------------------------------
    // Reserve equipment
    // --------------------------------------------------------

    equipment.status = EquipmentStatus.RESERVED;

    equipment.currentHolderId =
      request.beneficiaryId as any;

    await equipment.save();


    // --------------------------------------------------------
    // Update request
    // --------------------------------------------------------

    request.status = RequestStatus.APPROVED;

    request.assignedEquipmentId =
      equipment._id as any;

    request.fulfillmentNotes =
      notes ||
      'Request approved and equipment reserved for dispatch.';

    await request.save();


    // --------------------------------------------------------
    // Generate handover OTP
    // --------------------------------------------------------

    const handoverOtp = generateOTP();


    // --------------------------------------------------------
    // Create logistics delivery task
    // --------------------------------------------------------

    const task = await LogisticsTaskModel.create({
      taskType: TaskType.DELIVER_TO_BENEFICIARY,

      equipmentId: equipment._id as any,

      requestId: request._id as any,

      pickupAddress: pickupAddress || {
        street: 'Central NGO Warehouse',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',

        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760],
        },
      },

      dropoffAddress: request.deliveryAddress,

      handoverOtp,

      status: TaskStatus.UNASSIGNED,
    });


    // --------------------------------------------------------
    // Send OTP email to beneficiary
    // --------------------------------------------------------

    const beneficiary = await UserModel.findById(
      request.beneficiaryId
    );

    if (beneficiary?.email) {
      sendOtpEmail(
        beneficiary.email,
        handoverOtp,
        TaskType.DELIVER_TO_BENEFICIARY
      ).catch((error) => {
        console.error(
          'Failed to trigger beneficiary OTP email:',
          error
        );
      });
    }


    // --------------------------------------------------------
    // Send successful response
    // --------------------------------------------------------
    /*
      The OTP is not returned in the API response.
      It should be delivered through the email service.
    */

    return sendSuccess(
      res,
      200,
      'Request approved, equipment reserved, and dispatch task created!',
      {
        request,
        equipment,
        logisticsTask: task,

        otpSent: Boolean(beneficiary?.email),
      }
    );

  } catch (error) {
    console.error(
      'Approve and match request error:',
      error
    );

    return sendError(
      res,
      500,
      'Failed to approve request',
      error
    );
  }
};
