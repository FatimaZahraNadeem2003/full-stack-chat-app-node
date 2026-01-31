const express = require('express');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

router.delete('/delete/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ 
        message: 'Public ID is required' 
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.status(200).json({ 
        message: 'File deleted successfully',
        result: result
      });
    } else {
      res.status(404).json({ 
        message: 'File not found or already deleted',
        result: result
      });
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({ 
      message: 'Failed to delete file',
      error: error.message 
    });
  }
});

module.exports = router;