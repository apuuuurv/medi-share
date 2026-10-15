import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve(process.cwd(), 'uploads', 'equipment');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 60);

    cb(null, `${Date.now()}-${safeBase || 'equipment'}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'));
  }
};

export const equipmentPhotoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const medicalReportDir = path.resolve(process.cwd(), 'uploads', 'medical-reports');
fs.mkdirSync(medicalReportDir, { recursive: true });
export const medicalReportUpload = multer({ storage: multer.diskStorage({ destination: (_req,_file,cb)=>cb(null,medicalReportDir), filename: (_req,file,cb)=>{const ext=path.extname(file.originalname).toLowerCase(); cb(null,`${Date.now()}-${path.basename(file.originalname,ext).replace(/[^a-zA-Z0-9-_]/g,'-').slice(0,60)||'medical-report'}${ext}`);} }), fileFilter: (_req,file,cb)=>file.mimetype.startsWith('image/')?cb(null,true):cb(new Error('Please upload an image file (JPG, JPEG, PNG).')), limits:{fileSize:10*1024*1024} });
