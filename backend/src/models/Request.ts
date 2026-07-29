import { Schema, model, Document, Types } from 'mongoose';
import { RequestStatus, RequestUrgency } from '../constants/enums.js';

export interface IRequest extends Document {
  beneficiaryId: Types.ObjectId;
  equipmentCategory: string;
  prescriptionUrl: string;
  doctorName: string;
  hospitalName: string;
  diagnosis: string;
  urgencyLevel: RequestUrgency;
  calculatedUrgencyScore: number; // 1-100 calculated by Urgency Scoring Engine
  status: RequestStatus;
  assignedEquipmentId?: Types.ObjectId;
  assignedNGOId?: Types.ObjectId;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    location: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
  };
  fulfillmentNotes?: string;
  fulfilledAt?: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    beneficiaryId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    equipmentCategory: { type: String, required: true, index: true },
    prescriptionUrl: { type: String, required: true },
    doctorName: { type: String, required: true, trim: true },
    hospitalName: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true },
    urgencyLevel: { 
      type: String, 
      enum: Object.values(RequestUrgency), 
      required: true,
      default: RequestUrgency.MEDIUM 
    },
    calculatedUrgencyScore: { type: Number, required: true, default: 50 },
    status: { 
      type: String, 
      enum: Object.values(RequestStatus), 
      default: RequestStatus.SUBMITTED, 
      index: true 
    },
    assignedEquipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', index: true },
    assignedNGOId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
    },
    fulfillmentNotes: { type: String },
    fulfilledAt: { type: Date },
  },
  { timestamps: true }
);

RequestSchema.index({ 'deliveryAddress.location': '2dsphere' });

export const RequestModel = model<IRequest>('Request', RequestSchema);