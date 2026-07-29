import { Schema, model, Document, Types } from 'mongoose';
import { EquipmentStatus } from '../constants/enums.js';

export interface IEquipment extends Document {
  assetId: string; // e.g. MED-EQ-891023
  qrCodeUrl: string;
  name: string;
  category: string; // Wheelchair, Nebulizer, Oxygen Concentrator, etc.
  description: string;
  donorId: Types.ObjectId;
  assignedNGOId?: Types.ObjectId;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR';
  donationType: 'PERMANENT' | 'TEMPORARY';
  status: EquipmentStatus;
  media: string[];
  purchaseYear?: number;
  specifications?: Record<string, any>;
  lastSanitizedAt?: Date;
  reuseCount: number;
  currentHolderId?: Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    assetId: { type: String, required: true, unique: true, index: true },
    qrCodeUrl: { type: String, required: true },
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, index: true },
    description: { type: String, required: true },
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedNGOId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    condition: { type: String, enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'NEEDS_REPAIR'], required: true },
    donationType: { type: String, enum: ['PERMANENT', 'TEMPORARY'], required: true },
    status: { 
      type: String, 
      enum: Object.values(EquipmentStatus), 
      default: EquipmentStatus.DONATION_SUBMITTED, 
      index: true 
    },
    media: [{ type: String }],
    purchaseYear: Number,
    specifications: { type: Schema.Types.Mixed, default: {} },
    lastSanitizedAt: Date,
    reuseCount: { type: Number, default: 0 },
    currentHolderId: { type: Schema.Types.ObjectId, ref: 'User' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
  },
  { timestamps: true }
);

EquipmentSchema.index({ location: '2dsphere' });

export const EquipmentModel = model<IEquipment>('Equipment', EquipmentSchema);