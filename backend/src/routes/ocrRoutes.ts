import { Router } from 'express';
import { analyzeMedicalReport } from '../controllers/ocrController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';
import { medicalReportUpload } from '../middlewares/uploadMiddleware.js';
const router=Router();
router.post('/analyze-report',authenticateJWT,authorizeRoles(UserRole.BENEFICIARY,UserRole.NGO_ADMIN,UserRole.SUPER_ADMIN),medicalReportUpload.single('report'),analyzeMedicalReport);
export default router;
