
import { RequestUrgency } from '../constants/enums.js';

export interface MedicalIndicators {
  spo2?: number | null;
  heartRate?: number | null;
  temperature?: number | null;
  respiratoryRate?: number | null;
  bloodPressure?: string | null;
  conditions?: string[];
  keywords?: string[];
}

interface UrgencyParams {
  equipmentCategory: string;
  hasValidPrescription: boolean;
  medicalIndicators?: MedicalIndicators;
  diagnosis?: string;
}

interface UrgencyResult {
  urgencyLevel: RequestUrgency;
  calculatedUrgencyScore: number;
  reasons: string[];
}

export const calculateUrgencyScore = ({
  equipmentCategory,
  hasValidPrescription,
  medicalIndicators = {},
  diagnosis = '',
}: UrgencyParams): UrgencyResult => {
  let score = 0;
  const reasons: string[] = [];

  const {
    spo2,
    conditions = [],
    keywords = [],
  } = medicalIndicators;

  const normalizedCategory = (equipmentCategory || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .trim();

  const combinedText = [
    diagnosis,
    ...conditions,
    ...keywords,
  ]
    .join(' ')
    .toLowerCase();

  // 1. Prescription/document verification bonus
  if (hasValidPrescription) {
    score += 10;
    reasons.push('Valid medical document uploaded');
  }

  // 2. Equipment category risk
  const criticalEquipment = [
    'oxygen concentrator',
    'ventilator',
    'suction machine',
    'icu bed',
  ];

  const highRiskEquipment = [
    'nebulizer',
    'patient monitor',
    'electric wheelchair',
  ];

  if (
    criticalEquipment.some((item) =>
      normalizedCategory.includes(item),
    )
  ) {
    score += 25;
    reasons.push('High-risk medical equipment');
  } else if (
    highRiskEquipment.some((item) =>
      normalizedCategory.includes(item),
    )
  ) {
    score += 15;
    reasons.push('Moderate-to-high risk equipment');
  } else {
    score += 5;
  }

  // 3. Oxygen saturation indicator
  if (typeof spo2 === 'number') {
    if (spo2 < 90) {
      score += 45;
      reasons.push('Very low SpO2 indicator');
    } else if (spo2 < 94) {
      score += 30;
      reasons.push('Low SpO2 indicator');
    } else if (spo2 < 96) {
      score += 10;
      reasons.push('Reduced SpO2 indicator');
    }
  }

  // 4. Critical medical keywords
  const criticalKeywords = [
    'critical',
    'emergency',
    'life threatening',
    'cardiac arrest',
    'unconscious',
    'ventilator support',
    'severe respiratory distress',
  ];

  const highRiskKeywords = [
    'severe',
    'urgent',
    'immediate',
    'icu',
    'oxygen support',
    'hypoxia',
    'respiratory distress',
    'difficulty breathing',
    'shortness of breath',
  ];

  const criticalMatches = criticalKeywords.filter((keyword) =>
    combinedText.includes(keyword),
  );

  const highRiskMatches = highRiskKeywords.filter((keyword) =>
    combinedText.includes(keyword),
  );

  if (criticalMatches.length > 0) {
    score += 30;
    reasons.push('Critical medical keywords detected');
  } else if (highRiskMatches.length > 0) {
    score += 20;
    reasons.push('High-risk medical keywords detected');
  }

  // 5. Medical condition indicators
  const seriousConditions = [
    'pneumonia',
    'asthma',
    'copd',
    'heart failure',
    'stroke',
    'sepsis',
    'hypoxia',
  ];

  const matchedConditions = seriousConditions.filter((condition) =>
    combinedText.includes(condition),
  );

  if (matchedConditions.length > 0) {
    score += Math.min(matchedConditions.length * 8, 20);
    reasons.push('Serious medical condition indicators detected');
  }

  // 6. Limit score to 100
  const finalScore = Math.min(Math.max(score, 0), 100);

  // 7. Automatically assign urgency level
  let urgencyLevel: RequestUrgency;

  if (finalScore >= 75) {
    urgencyLevel = RequestUrgency.CRITICAL;
  } else if (finalScore >= 50) {
    urgencyLevel = RequestUrgency.HIGH;
  } else if (finalScore >= 25) {
    urgencyLevel = RequestUrgency.MEDIUM;
  } else {
    urgencyLevel = RequestUrgency.LOW;
  }

  return {
    urgencyLevel,
    calculatedUrgencyScore: finalScore,
    reasons,
  };
};
