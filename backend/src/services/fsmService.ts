import { EquipmentStatus } from '../constants/enums.js';

// Defines the legal transitions allowed for any given equipment state
const VALID_TRANSITIONS: Record<EquipmentStatus, EquipmentStatus[]> = {
  [EquipmentStatus.DONATION_SUBMITTED]: [EquipmentStatus.VERIFIED, EquipmentStatus.REJECTED],
  [EquipmentStatus.REJECTED]: [], // Terminal state
  [EquipmentStatus.VERIFIED]: [EquipmentStatus.COLLECTION_PENDING],
  [EquipmentStatus.COLLECTION_PENDING]: [EquipmentStatus.IN_TRANSIT_TO_WAREHOUSE],
  [EquipmentStatus.IN_TRANSIT_TO_WAREHOUSE]: [EquipmentStatus.IN_INVENTORY],
  [EquipmentStatus.IN_INVENTORY]: [EquipmentStatus.RESERVED, EquipmentStatus.UNDER_MAINTENANCE, EquipmentStatus.RETIRED],
  [EquipmentStatus.AVAILABLE]: [EquipmentStatus.RESERVED, EquipmentStatus.UNDER_MAINTENANCE, EquipmentStatus.RETIRED],
  [EquipmentStatus.RESERVED]: [EquipmentStatus.ISSUED, EquipmentStatus.IN_INVENTORY],
  [EquipmentStatus.ISSUED]: [EquipmentStatus.RETURN_PENDING],
  [EquipmentStatus.RETURN_PENDING]: [EquipmentStatus.IN_TRANSIT_TO_INSPECTION],
  [EquipmentStatus.IN_TRANSIT_TO_INSPECTION]: [EquipmentStatus.UNDER_MAINTENANCE],
  [EquipmentStatus.UNDER_MAINTENANCE]: [EquipmentStatus.IN_INVENTORY, EquipmentStatus.RETIRED],
  [EquipmentStatus.RETIRED]: [], // Terminal state
};

export const validateStateTransition = (currentStatus: EquipmentStatus, newStatus: EquipmentStatus): boolean => {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
};
