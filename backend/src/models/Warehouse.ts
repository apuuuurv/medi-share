import { Schema, model, Document } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  code: string; // e.g., "HUB-MUM-01"
  managerId: Schema.Types.ObjectId;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    location: { type: 'Point'; coordinates: [number, number] };
  };
  totalCapacity: number;
  currentStockCount: number;
  isActive: boolean;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] },
    },
    totalCapacity: { type: Number, required: true, default: 100 },
    currentStockCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WarehouseSchema.index({ 'address.location': '2dsphere' });

export const WarehouseModel = model<IWarehouse>('Warehouse', WarehouseSchema);