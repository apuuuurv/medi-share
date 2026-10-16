import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'node:fs';
import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { extractMedicalInformation } from '../services/medicalExtractionService.js';
import { analyzeMedicalTextWithGemini } from '../services/geminiService.js';

export const analyzeMedicalReport = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  let worker: any = null;

  try {
    // 1. Check whether a file was uploaded
    if (!req.file) {
      return sendError(
        res,
        400,
        'Please upload a medical report or prescription image.',
      );
    }

    // 2. Import Tesseract.js worker
    const { createWorker } = await import('tesseract.js');

    // 3. Create OCR worker
    worker = await createWorker('eng');

    // 4. Perform OCR on the uploaded image
    const result = await worker.recognize(req.file.path);

    const rawText = result.data.text.trim();

    // 5. Reject images with no readable text
    if (!rawText) {
      return sendError(
        res,
        422,
        'No readable text found. Please upload a clearer medical document.',
      );
    }

    // 6. Perform local medical information extraction
    const extractedData = extractMedicalInformation(rawText);
    
    // Document classification using the FastAPI service
    let documentClassification: any = null;

    try {
      const classifierForm = new FormData();

      classifierForm.append(
        'file',
        createReadStream(req.file.path),
        {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        },
      );

      const classifierResponse = await axios.post(
        `${process.env.DOCUMENT_CLASSIFIER_URL || 'http://127.0.0.1:8000'}/predict`,
        classifierForm,
        {
          headers: classifierForm.getHeaders(),
          timeout: 30000,
        },
      );

      documentClassification = classifierResponse.data;
    } catch (classifierError) {
      console.error(
        'Document classification failed:',
        classifierError,
      );

      // Keep existing OCR and Gemini analysis working
      documentClassification = {
        available: false,
        message: 'Document classifier is currently unavailable.',
      };
    }


    // 7. Reject unrelated documents using local validation
    if (!extractedData.isMedicalDocument) {
      return sendError(
        res,
        422,
        extractedData.validationMessage ||
          'This does not appear to be a valid medical document.',
      );
    }

    // 8. Analyze the OCR text using Gemini AI
    const geminiAnalysis = await analyzeMedicalTextWithGemini(rawText);

    // 9. Reject documents Gemini identifies as unrelated
    if (!geminiAnalysis.isMedicalDocument) {
      return sendError(
        res,
        422,
        geminiAnalysis.validationMessage ||
          'The uploaded document does not appear to be a valid prescription or medical document.',
      );
    }

    // 10. Generate URL for the uploaded medical document
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const reportUrl =
      `${baseUrl}/uploads/medical-reports/${req.file.filename}`;

    // 11. Return OCR + AI analysis results
    return sendSuccess(
      res,
      200,
      'Medical document analyzed successfully.',
      {
        reportUrl,
        rawText,

        // Existing rule-based extraction
        extractedData,

        // Gemini AI analysis
  // Gemini AI analysis
geminiAnalysis,

// FastAPI document classification
documentClassification,

// Human review is always required
requiresHumanReview: true,
      },
    );
  } catch (error) {
    console.error('OCR and Gemini analysis failed:', error);

    return sendError(
      res,
      500,
      'Failed to analyze medical document.',
      error,
    );
  } finally {
    // 12. Release OCR worker resources
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminationError) {
        console.error(
          'Failed to terminate OCR worker:',
          terminationError,
        );
      }
    }
  }
};
