import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { EquipmentModel } from '../models/Equipment.js';
import { RequestModel } from '../models/Request.js';
import { LogisticsTaskModel, TaskStatus } from '../models/LogisticsTask.js';
import { WarehouseModel } from '../models/Warehouse.js';
import { UserModel } from '../models/User.js';
import { EquipmentStatus, RequestStatus, UserRole } from '../constants/enums.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// Get high-level NGO Dashboard KPIs & Metrics
export const getDashboardOverview = async (req: AuthRequest, res: Response) => {
  try {
    // Run DB queries in parallel for efficiency
    const [
      totalEquipment,
      availableEquipment,
      issuedEquipment,
      underMaintenanceEquipment,
      pendingRequests,
      fulfilledRequests,
      activeTasks,
      totalWarehouses,
      totalVolunteers,
    ] = await Promise.all([
      EquipmentModel.countDocuments(),
      // Checks both IN_INVENTORY and AVAILABLE to handle any status enum conventions
      EquipmentModel.countDocuments({ 
        status: { $in: [EquipmentStatus.IN_INVENTORY, EquipmentStatus.AVAILABLE] } 
      }),
      EquipmentModel.countDocuments({ status: EquipmentStatus.ISSUED }),
      EquipmentModel.countDocuments({ status: EquipmentStatus.UNDER_MAINTENANCE }),
      RequestModel.countDocuments({ status: RequestStatus.PENDING }),
      RequestModel.countDocuments({ status: RequestStatus.DELIVERED }),
      // Active tasks include both assigned and actively in-progress dispatches
      LogisticsTaskModel.countDocuments({ 
        status: { $in: [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS] } 
      }),
      WarehouseModel.countDocuments({ isActive: true }),
      UserModel.countDocuments({ role: UserRole.VOLUNTEER }),
    ]);

    // Fetch top 5 urgent unassigned beneficiary requests
    const highPriorityRequests = await RequestModel.find({ status: RequestStatus.PENDING })
      .sort({ urgencyScore: -1, createdAt: 1 })
      .limit(5)
      .populate('beneficiaryId', 'fullName email phone');

    // Aggregate equipment counts by category
    const categoryBreakdown = await EquipmentModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    const dashboardData = {
      kpis: {
        totalEquipment,
        availableEquipment,
        issuedEquipment,
        underMaintenanceEquipment,
        pendingRequests,
        fulfilledRequests,
        activeTasks,
        totalWarehouses,
        totalVolunteers,
        fulfillmentRatePercentage: (pendingRequests + fulfilledRequests) > 0 
          ? Number(((fulfilledRequests / (pendingRequests + fulfilledRequests)) * 100).toFixed(2)) 
          : 0,
      },
      categoryBreakdown,
      highPriorityRequests,
    };

    return sendSuccess(res, 200, 'Dashboard analytics fetched successfully', dashboardData);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch dashboard analytics', error);
  }
};