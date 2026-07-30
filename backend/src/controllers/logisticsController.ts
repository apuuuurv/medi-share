import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { LogisticsTaskModel, TaskStatus } from '../models/LogisticsTask.js';
import { EquipmentModel } from '../models/Equipment.js';
import { RequestModel } from '../models/Request.js';
import { EquipmentStatus, RequestStatus } from '../constants/enums.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { emitStatusUpdate } from '../services/socketService.js';
import { sendOtpEmail, sendTaskAssignmentEmail } from '../services/emailService.js';
import { UserModel } from '../models/User.js';

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. Create Dispatch Task (Called by NGO or automated system)
export const createLogisticsTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskType, equipmentId, requestId, pickupAddress, dropoffAddress, recipientEmail } = req.body;
    const handoverOtp = generateOTP();

    // Ensure 2dsphere geo indices have default fallback coordinates if omitted
    const formattedPickup = {
      ...pickupAddress,
      location: pickupAddress?.location || { type: 'Point', coordinates: [0, 0] },
    };

    const formattedDropoff = {
      ...dropoffAddress,
      location: dropoffAddress?.location || { type: 'Point', coordinates: [0, 0] },
    };

    const task = await LogisticsTaskModel.create({
      taskType,
      equipmentId: equipmentId as any,
      requestId: requestId ? (requestId as any) : undefined,
      pickupAddress: formattedPickup,
      dropoffAddress: formattedDropoff,
      handoverOtp,
    });

    // 📧 Trigger OTP Email Notification asynchronously
    if (recipientEmail) {
      sendOtpEmail(recipientEmail, handoverOtp, taskType).catch((err) =>
        console.error('Failed to trigger OTP email:', err)
      );
    }

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

    // ⚡ Real-Time Socket Emission
    emitStatusUpdate(`task_${task._id}`, 'task_status_changed', {
      taskId: task._id,
      status: task.status,
      volunteerId: task.volunteerId,
      message: 'Volunteer accepted the task and is en route.',
    });

    // 📧 Fetch volunteer email from MongoDB & Trigger Email Alert
    const volunteer = await UserModel.findById(volunteerIdStr);
    if (volunteer?.email) {
      const pickupStr = task.pickupAddress?.street || 'Warehouse Location';
      const dropoffStr = task.dropoffAddress?.street || 'Beneficiary Address';

      sendTaskAssignmentEmail(volunteer.email, task._id.toString(), pickupStr, dropoffStr).catch((err) =>
        console.error('Failed to send task assignment email:', err)
      );
    }

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

    // ⚡ Real-Time Socket Emission
    emitStatusUpdate(`task_${task._id}`, 'task_completed', {
      taskId: task._id,
      status: task.status,
      completedAt: task.completedAt,
      message: 'Handover verified successfully via OTP!',
    });

    return sendSuccess(res, 200, 'Task completed and equipment handover verified via OTP!', task);
  } catch (error) {
    return sendError(res, 500, 'Failed to complete task', error);
  }
};

// 5. Get Tasks Assigned to Logged-in Volunteer
export const getMyTasks = async (req: AuthRequest, res: Response) => {
  try {
    const volunteerIdStr = req.user?.userId;
    if (!volunteerIdStr) return sendError(res, 401, 'Unauthorized');

    const tasks = await LogisticsTaskModel.find({
      volunteerId: new Types.ObjectId(volunteerIdStr) as any,
    })
      .populate('equipmentId', 'name category assetId status')
      .populate('requestId')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, 200, 'Volunteer tasks fetched successfully', tasks);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch volunteer tasks', error);
  }
};

// 6. Get Single Logistics Task Details
export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await LogisticsTaskModel.findById(id)
      .populate('equipmentId')
      .populate('requestId')
      .populate('volunteerId', 'name email phone');

    if (!task) return sendError(res, 404, 'Logistics task not found');

    return sendSuccess(res, 200, 'Task details fetched successfully', task);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch task details', error);
  }
};

// 7. Update Task Status Manually
export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(TaskStatus).includes(status)) {
      return sendError(res, 400, 'Invalid status provided');
    }

    const task = await LogisticsTaskModel.findById(id);
    if (!task) return sendError(res, 404, 'Task not found');

    task.status = status;
    await task.save();

    // ⚡ Real-Time Socket Emission
    emitStatusUpdate(`task_${task._id}`, 'task_status_changed', {
      taskId: task._id,
      status: task.status,
      message: `Task status updated to ${status}`,
    });

    return sendSuccess(res, 200, `Task status updated to ${status}`, task);
  } catch (error) {
    return sendError(res, 500, 'Failed to update task status', error);
  }
};