import { Schema, model, Document, Types } from 'mongoose';
import { EquipmentStatus } from '../constants/enums.js';

export interface IEquipmentHistory extends Document {
  equipmentId: Types.ObjectId;
  fromStatus: EquipmentStatus;
  toStatus: EquipmentStatus;
  actorId: Types.ObjectId;
  remarks: string;
}

const EquipmentHistorySchema = new Schema<IEquipmentHistory>(
  {
    equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    fromStatus: { type: String, enum: Object.values(EquipmentStatus), required: true },
    toStatus: { type: String, enum: Object.values(EquipmentStatus), required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String, required: true },
  },
  { timestamps: true }
);

export const EquipmentHistoryModel = model<IEquipmentHistory>('EquipmentHistory', EquipmentHistorySchema);