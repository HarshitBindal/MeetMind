const express = require('express');
const multer = require('multer');
const { createFromText, createFromFile } = require('../controllers/meeting.controller');
const { protect } = require('../middleware/auth');
const { uploadTranscriptFile } = require('../middleware/upload');

const router = express.Router();

// All meeting routes require authentication
router.use(protect);

// Create a meeting via pasted transcript
router.post('/text', createFromText);

// Create a meeting via uploaded transcript file (.txt or .md)
router.post('/file', (req, res, next) => {
  uploadTranscriptFile.single('transcriptFile')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (e.g., file too large)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size is 2 MB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // Custom file filter errors (e.g., wrong file type)
      return res.status(400).json({ message: err.message });
    }
    // No upload error — proceed to controller
    next();
  });
}, createFromFile);

module.exports = router;
