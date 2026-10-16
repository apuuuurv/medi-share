
export interface MedicalExtractionResult {
  spo2: number | null;
  heartRate: number | null;
  temperature: number | null;
  bloodPressure: string | null;
  respiratoryRate: number | null;
  conditions: string[];
  keywords: string[];
  isMedicalDocument: boolean;
  documentType: 'prescription' | 'medical_report' | 'unknown';
  validationMessage: string;
}

const findNumber = (
  text: string,
  patterns: RegExp[],
): number | null => {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const number = Number(match[1]);

      if (!Number.isNaN(number)) {
        return number;
      }
    }
  }

  return null;
};

export const extractMedicalInformation = (
  rawText: string,
): MedicalExtractionResult => {
  const text = rawText.replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  // Extract SpO2
  const spo2 = findNumber(text, [
    /(?:spo2|sp02|o2\s*sat(?:uration)?|oxygen\s*saturation)\s*[:=-]?\s*(\d{2,3})\s*%?/i,
    /(\d{2,3})\s*%\s*(?:spo2|oxygen\s*sat(?:uration)?)/i,
  ]);

  // Extract heart rate
  const heartRate = findNumber(text, [
    /(?:heart\s*rate|pulse\s*rate|pulse|hr)\s*[:=-]?\s*(\d{2,3})\s*(?:bpm)?/i,
  ]);

  // Extract temperature
  const temperature = findNumber(text, [
    /(?:temperature|temp)\s*[:=-]?\s*(\d{2,3}(?:\.\d)?)\s*(?:°?c|celsius|°?f|fahrenheit)?/i,
  ]);

  // Extract respiratory rate
  const respiratoryRate = findNumber(text, [
    /(?:respiratory\s*rate|resp\.?\s*rate|rr)\s*[:=-]?\s*(\d{1,2})\s*(?:\/min|bpm|breaths)?/i,
  ]);

  // Extract blood pressure
  const bloodPressureMatch =
    text.match(
      /(?:blood\s*pressure|bp|b\/?p)\s*[:=-]?\s*(\d{2,3}\s*\/\s*\d{2,3})/i,
    ) ||
    text.match(
      /\b(\d{2,3}\s*\/\s*\d{2,3})\s*(?:mmhg)?\b/i,
    );

  // Detect medical conditions
  const conditions = [
    'respiratory distress',
    'difficulty breathing',
    'shortness of breath',
    'breathlessness',
    'pneumonia',
    'asthma',
    'copd',
    'covid',
    'heart failure',
    'cardiac arrest',
    'chest pain',
    'stroke',
    'sepsis',
    'fever',
    'hypoxia',
    'low oxygen',
    'oxygen dependency',
    'oxygen required',
    'ventilator support',
    'unconscious',
  ].filter((condition) => lower.includes(condition));

  // Detect urgency-related keywords
  const keywords = [
    'critical',
    'severe',
    'emergency',
    'urgent',
    'immediate',
    'icu',
    'oxygen support',
    'high risk',
    'life threatening',
    'monitoring required',
  ].filter((keyword) => lower.includes(keyword));

  // Prescription-related keywords
  const prescriptionKeywords = [
    'prescription',
    'prescribed',
    'medicine',
    'medication',
    'tablet',
    'capsule',
    'syrup',
    'dosage',
    'dose',
    'mg',
    'ml',
    'doctor',
    'physician',
    'rx',
    'refill',
    'take',
  ];

  // Medical report-related keywords
  const medicalReportKeywords = [
    'patient',
    'diagnosis',
    'clinical',
    'medical report',
    'hospital',
    'blood pressure',
    'heart rate',
    'temperature',
    'oxygen saturation',
    'spo2',
    'respiratory rate',
    'laboratory',
    'lab report',
  ];

  // Count matching prescription keywords
  const prescriptionMatches = prescriptionKeywords.filter(
    (keyword) => {
      const keywordRegex = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i',
      );

      return keywordRegex.test(lower);
    },
  );

  // Count matching medical report keywords
  const medicalReportMatches = medicalReportKeywords.filter(
    (keyword) => lower.includes(keyword),
  );

  // Prescription validation
  const hasPrescriptionIdentity =
    lower.includes('doctor') ||
    lower.includes('physician') ||
    lower.includes('prescription') ||
    lower.includes('prescribed') ||
    lower.includes('rx');

  const isPrescription =
    prescriptionMatches.length >= 2 &&
    hasPrescriptionIdentity;

  // Medical report validation
  const hasExtractedVital =
    spo2 !== null ||
    heartRate !== null ||
    temperature !== null ||
    respiratoryRate !== null ||
    bloodPressureMatch !== null;

  const isMedicalReport =
    medicalReportMatches.length >= 2 ||
    hasExtractedVital;

  // Overall document validation
  const isMedicalDocument =
    isPrescription || isMedicalReport;

  const documentType: 'prescription' | 'medical_report' | 'unknown' =
    isPrescription
      ? 'prescription'
      : isMedicalReport
        ? 'medical_report'
        : 'unknown';

  const validationMessage = isMedicalDocument
    ? 'Medical document detected successfully.'
    : 'The uploaded document does not appear to be a prescription or medical report. Please upload a valid medical document.';

  return {
    spo2:
      spo2 !== null && spo2 >= 0 && spo2 <= 100
        ? spo2
        : null,

    heartRate,

    temperature,

    bloodPressure:
      bloodPressureMatch?.[1]?.replace(/\s/g, '') || null,

    respiratoryRate,

    conditions,

    keywords,

    isMedicalDocument,

    documentType,

    validationMessage,
  };
};
