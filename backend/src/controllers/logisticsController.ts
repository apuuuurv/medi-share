import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { LogisticsTaskModel, TaskStatus } from '../models/LogisticsTask.js';
import { EquipmentModel } from '../models/Equipment.js';
import { RequestModel } from '../models/Request.js';
import { EquipmentStatus, RequestStatus } from '../constants/enums.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. Create Dispatch Task (Called by NGO or automated system)
export const createLogisticsTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskType, equipmentId, requestId, pickupAddress, dropoffAddress } = req.body;
    const handoverOtp = generateOTP();

    const task = await LogisticsTaskModel.create({
      taskType,
      equipmentId: equipmentId as any,
      requestId: requestId ? (requestId as any) : undefined,
      pickupAddress,
      dropoffAddress,
      handoverOtp,
    });

    return sendSuccess(res, 201, 'Logistics task created successfully', { task, otpCode: handoverOtp });
  } catch (error) {
    return sendError(res, 500, 'Failed to create task', error);
  }
};

// 2. Fetch Available Tasks for Volunteers
export const getAvailableTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await LogisticsTaskModel.find({ status: TaskStatus.UNASSIGNED })
      .populate('equipmentId', 'name category assetId')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Available tasks fetched', tasks);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch tasks', error);
  }
};

// 3. Volunteer Accepts Task
export const acceptTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const volunteerIdStr = req.user?.userId;

    if (!volunteerIdStr) return sendError(res, 401, 'Unauthorized');

    const task = await LogisticsTaskModel.findById(id);
    if (!task) return sendError(res, 404, 'Task not found');
    if (task.status !== TaskStatus.UNASSIGNED) return sendError(res, 400, 'Task already assigned or in progress');

    task.volunteerId = volunteerIdStr as any;
    task.status = TaskStatus.IN_PROGRESS;
    await task.save();

    return sendSuccess(res, 200, 'Task accepted successfully', task);
  } catch (error) {
    return sendError(res, 500, 'Failed to accept task', error);
  }
};

// 4. Verify OTP & Complete Task Handover
export const completeTaskWithOTP = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const task = await LogisticsTaskModel.findById(id);
    if (!task) return sendError(res, 404, 'Task not found');

    if (task.handoverOtp !== otp) {
      return sendError(res, 400, 'Invalid Handover OTP code');
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    await task.save();

    // Sync status updates based on task type
    if (task.requestId) {
      await RequestModel.findByIdAndUpdate(task.requestId, { status: RequestStatus.DELIVERED });
      await EquipmentModel.findByIdAndUpdate(task.equipmentId, { status: EquipmentStatus.ISSUED });
    } else {
      await EquipmentModel.findByIdAndUpdate(task.equipmentId, { status: EquipmentStatus.IN_INVENTORY });
    }

    return sendSuccess(res, 200, 'Task completed and equipment handover verified via OTP!', task);
  } catch (error) {
    return sendError(res, 500, 'Failed to complete task', error);
  }
};