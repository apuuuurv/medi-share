import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { EquipmentModel } from '../models/Equipment.js';
import { RequestModel } from '../models/Request.js';
import { LogisticsTaskModel, TaskStatus } from '../models/LogisticsTask.js';
import { WarehouseModel } from '../models/Warehouse.js';
import { EquipmentStatus, RequestStatus } from '../constants/enums.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// Get high-level NGO Dashboard KPIs & Metrics
export const getDashboardOverview = async (req: AuthRequest, res: Response) => {
  try {
    // Run DB queries in parallel for efficiency
    const [
      totalEquipment,
      availableEquipment,
      issuedEquipment,
      pendingRequests,
      fulfilledRequests,
      activeTasks,
      totalWarehouses,
    ] = await Promise.all([
      EquipmentModel.countDocuments(),
      EquipmentModel.countDocuments({ status: EquipmentStatus.AVAILABLE }),
      EquipmentModel.countDocuments({ status: EquipmentStatus.ISSUED }),
      RequestModel.countDocuments({ status: RequestStatus.PENDING }),
      RequestModel.countDocuments({ status: RequestStatus.DELIVERED }),
      LogisticsTaskModel.countDocuments({ status: TaskStatus.IN_PROGRESS }),
      WarehouseModel.countDocuments({ isActive: true }),
    ]);

    // Fetch top 5 urgent unassigned beneficiary requests
    const highPriorityRequests = await RequestModel.find({ status: RequestStatus.PENDING })
      .sort({ urgencyScore: -1 })
      .limit(5)
      .populate('beneficiaryId', 'fullName email');

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
        pendingRequests,
        fulfilledRequests,
        activeTasks,
        totalWarehouses,
        fulfillmentRatePercentage: totalEquipment > 0 
          ? Number(((fulfilledRequests / (pendingRequests + fulfilledRequests || 1)) * 100).toFixed(2)) 
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