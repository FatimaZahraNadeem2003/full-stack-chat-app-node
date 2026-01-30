const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Upload directory:', uploadDir);
    console.log('Directory exists:', fs.existsSync(uploadDir));
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'application/pdf',
    'application/zip',
    'application/x-rar-compressed',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  console.log('File type:', file.mimetype);
  console.log('File name:', file.originalname);
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log('File type accepted');
    cb(null, true);
  } else {
    console.log('File type rejected');
    cb(new Error('Invalid file type: ' + file.mimetype), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
});

router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: 'File upload error', error: err.message });
    } else if (err) {
      console.error('Unknown error:', err);
      return res.status(400).json({ message: 'File upload failed', error: err.message });
    }
    
    try {
      console.log('Upload request received');
      console.log('Request file:', req.file);
      
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('File uploaded successfully:', req.file.filename);
      const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      console.log('Generated file URL:', fileUrl);
      
      res.status(200).json({
        message: 'File uploaded successfully',
        fileUrl: fileUrl,
        fileName: req.file.filename,
        fileType: req.file.mimetype
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'File upload failed', error: error.message });
    }
  });
});

router.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(uploadDir));

module.exports = router;