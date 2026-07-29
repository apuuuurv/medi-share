import { Schema, model, Document } from 'mongoose';

export enum TaskType {
  PICKUP_FROM_DONOR = 'PICKUP_FROM_DONOR',
  DELIVER_TO_BENEFICIARY = 'DELIVER_TO_BENEFICIARY',
  RETURN_TO_WAREHOUSE = 'RETURN_TO_WAREHOUSE',
}

export enum TaskStatus {
  UNASSIGNED = 'UNASSIGNED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ILogisticsTask extends Document {
  taskType: TaskType;
  equipmentId: Schema.Types.ObjectId;
  requestId?: Schema.Types.ObjectId;
  volunteerId?: Schema.Types.ObjectId;
  status: TaskStatus;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    location: { type: 'Point'; coordinates: [number, number] };
  };
  dropoffAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    location: { type: 'Point'; coordinates: [number, number] };
  };
  handoverOtp: string; // 6-digit OTP for completion
  completedAt?: Date;
}

const LogisticsTaskSchema = new Schema<ILogisticsTask>(
  {
    taskType: { type: String, enum: Object.values(TaskType), required: true },
    equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', index: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.UNASSIGNED, index: true },
    pickupAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] },
    },
    dropoffAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] },
    },
    handoverOtp: { type: String, required: true },
    completedAt: Date,
  },
  { timestamps: true }
);

LogisticsTaskSchema.index({ 'pickupAddress.location': '2dsphere' });
LogisticsTaskSchema.index({ 'dropoffAddress.location': '2dsphere' });

export const LogisticsTaskModel = model<ILogisticsTask>('LogisticsTask', LogisticsTaskSchema);