const multer = require('multer');
const path = require('path');

/**
 * Multer middleware for handling transcript file uploads.
 *
 * - Stores files in backend/src/uploads/ temporarily.
 * - Only allows .txt and .md files.
 * - Limits file size to 2 MB.
 */

// Storage configuration: save to uploads/ with a unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Unique name: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter: only allow .txt and .md files
const transcriptFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.txt', '.md', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .txt, .md, and .pdf files are allowed'), false);
  }
};

// Create the configured multer instance
const uploadTranscriptFile = multer({
  storage,
  fileFilter: transcriptFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB max
  },
});

module.exports = { uploadTranscriptFile };
