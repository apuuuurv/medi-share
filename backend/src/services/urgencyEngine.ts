import { RequestUrgency } from '../constants/enums.js';

interface UrgencyParams {
  urgencyLevel: RequestUrgency;
  equipmentCategory: string;
  hasValidPrescription: boolean;
}

export const calculateUrgencyScore = ({
  urgencyLevel,
  equipmentCategory,
  hasValidPrescription,
}: UrgencyParams): number => {
  let score = 0;

  // 1. Base Score from User Self-Reported / Doctor Urgency
  switch (urgencyLevel) {
    case RequestUrgency.CRITICAL:
      score += 50;
      break;
    case RequestUrgency.HIGH:
      score += 35;
      break;
    case RequestUrgency.MEDIUM:
      score += 20;
      break;
    case RequestUrgency.LOW:
      score += 10;
      break;
  }

  // 2. High-Risk Equipment Category Multiplier
  const criticalCategories = ['Oxygen Concentrator', 'Ventilator', 'Suction Machine', 'ICU Bed'];
  const highCategories = ['Nebulizer', 'Electric Wheelchair', 'Patient Monitor'];

  const categoryLower = equipmentCategory.toLowerCase();
  if (criticalCategories.some((cat) => categoryLower.includes(cat.toLowerCase()))) {
    score += 35;
  } else if (highCategories.some((cat) => categoryLower.includes(cat.toLowerCase()))) {
    score += 20;
  } else {
    score += 10;
  }

  // 3. Medical Prescription Bonus
  if (hasValidPrescription) {
    score += 15;
  }

  // Cap score between 0 and 100
  return Math.min(Math.max(score, 0), 100);
};