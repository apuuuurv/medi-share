import { Schema, model, Document } from 'mongoose';

export enum MaintenanceType {
  SANITIZATION = 'SANITIZATION',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  CALIBRATION = 'CALIBRATION',
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

export interface IMaintenanceLog extends Document {
  equipmentId: Schema.Types.ObjectId;
  warehouseId: Schema.Types.ObjectId;
  performedBy: Schema.Types.ObjectId;
  type: MaintenanceType;
  status: MaintenanceStatus;
  notes?: string;
  cost?: number;
  completedAt?: Date;
}

const MaintenanceLogSchema = new Schema<IMaintenanceLog>(
  {
    equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(MaintenanceType), required: true },
    status: { type: String, enum: Object.values(MaintenanceStatus), default: MaintenanceStatus.PENDING },
    notes: String,
    cost: { type: Number, default: 0 },
    completedAt: Date,
  },
  { timestamps: true }
);

export const MaintenanceLogModel = model<IMaintenanceLog>('MaintenanceLog', MaintenanceLogSchema);