const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/quicktime',
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
    fileSize: 50 * 1024 * 1024 
  }
});

router.post('/', (req, res, next) => {
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

      console.log('Uploading to Cloudinary...');
      
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ message: 'Cloudinary upload failed', error: error.message });
          }
          
          console.log('File uploaded to Cloudinary successfully:', result.secure_url);
          
          res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl: result.secure_url,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            publicId: result.public_id
          });
        }
      );
      
      uploadStream.end(req.file.buffer);
      
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'File upload failed', error: error.message });
    }
  });
});

module.exports = router;