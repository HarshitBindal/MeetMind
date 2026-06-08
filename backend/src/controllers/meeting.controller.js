const { processMeetingInput } = require('../services/meeting.service');
const Meeting = require('../models/Meeting');
const { createTranscriptMeetingSchema, updateMeetingSchema } = require('../validators/meeting.validator');

/**
 * Validates that the title from a multipart form is present and within limits.
 * Used by file/audio/video endpoints where Zod doesn't validate the body.
 *
 * @param {string} title - The raw title from req.body.
 * @returns {string} The trimmed, validated title.
 * @throws {Object} An error object with a `statusCode` and `message` property.
 */
const validateTitle = (title) => {
  if (!title || title.trim().length === 0) {
    const err = new Error('Meeting title is required.');
    err.statusCode = 400;
    throw err;
  }
  if (title.trim().length > 200) {
    const err = new Error('Title cannot exceed 200 characters.');
    err.statusCode = 400;
    throw err;
  }
  return title.trim();
};

/**
 * @desc    Create a meeting from pasted transcript text
 * @route   POST /api/meetings/text
 * @access  Private
 */
const createFromText = async (req, res) => {
  try {
    // Validate request body with Zod (title + transcript)
    const { title, transcript } = createTranscriptMeetingSchema.parse(req.body);

    // Delegate to the unified processing pipeline
    const meeting = await processMeetingInput({
      userId: req.user._id,
      title,
      inputType: 'transcript',
      rawText: transcript,
    });

    res.status(201).json(meeting);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map((e) => e.message),
      });
    }
    console.error('Meeting processing error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error processing meeting' });
  }
};

/**
 * @desc    Create a meeting from an uploaded transcript file (.txt, .md, or .pdf)
 * @route   POST /api/meetings/file
 * @access  Private
 */
const createFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please upload a .txt, .md, or .pdf file.' });
    }

    const title = validateTitle(req.body.title);

    const meeting = await processMeetingInput({
      userId: req.user._id,
      title,
      inputType: 'transcript_file',
      file: req.file,
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('File meeting processing error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error processing uploaded file' });
  }
};

/**
 * @desc    Create a meeting from an uploaded audio file
 * @route   POST /api/meetings/audio
 * @access  Private
 */
const createMeetingFromAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded. Please upload an .mp3, .wav, .m4a, or .webm file.' });
    }

    const title = validateTitle(req.body.title);

    const meeting = await processMeetingInput({
      userId: req.user._id,
      title,
      inputType: 'audio',
      file: req.file,
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Audio meeting processing error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error processing audio file' });
  }
};

/**
 * @desc    Create a meeting from an uploaded video file
 * @route   POST /api/meetings/video
 * @access  Private
 */
const createMeetingFromVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded. Please upload an .mp4, .mov, or .webm file.' });
    }

    const title = validateTitle(req.body.title);

    const meeting = await processMeetingInput({
      userId: req.user._id,
      title,
      inputType: 'video',
      file: req.file,
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Video meeting processing error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error processing video file' });
  }
};

// ─────────────────────────────────────────────────
//  CRUD Operations (Phase 9)
// ─────────────────────────────────────────────────

/**
 * @desc    Get all meetings for the logged-in user
 * @route   GET /api/meetings
 * @access  Private
 */
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ userId: req.user._id })
      .sort({ createdAt: -1 }); // Newest first (rawText excluded automatically via select: false)

    res.json(meetings);
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ message: 'Server error fetching meetings' });
  }
};

/**
 * @desc    Get a single meeting by ID (includes rawText for detail view)
 * @route   GET /api/meetings/:id
 * @access  Private
 */
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user._id, // Ensure the user owns this meeting
    }).select('+rawText'); // Explicitly include rawText for the detail view

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found.' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Get meeting by ID error:', error);
    // Handle invalid MongoDB ObjectId format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting not found.' });
    }
    res.status(500).json({ message: 'Server error fetching meeting' });
  }
};

/**
 * @desc    Delete a meeting by ID
 * @route   DELETE /api/meetings/:id
 * @access  Private
 */
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id, // Ensure the user can only delete their own meetings
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found.' });
    }

    res.json({ message: 'Meeting deleted successfully.' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting not found.' });
    }
    res.status(500).json({ message: 'Server error deleting meeting' });
  }
};

// ─────────────────────────────────────────────────
//  Edit & Review (Phase 10)
// ─────────────────────────────────────────────────

/**
 * @desc    Update a meeting (title, summary, actionItems, decisions)
 * @route   PUT /api/meetings/:id
 * @access  Private
 */
const updateMeeting = async (req, res) => {
  try {
    // Validate the incoming payload
    const updates = updateMeetingSchema.parse(req.body);

    // Find the meeting and ensure ownership
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select('+rawText');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found.' });
    }

    // Apply only the fields that were provided
    if (updates.title !== undefined) meeting.title = updates.title;
    if (updates.summary !== undefined) meeting.summary = updates.summary;
    if (updates.actionItems !== undefined) meeting.actionItems = updates.actionItems;
    if (updates.decisions !== undefined) meeting.decisions = updates.decisions;

    // Save — Mongoose will automatically update the `updatedAt` timestamp
    await meeting.save();

    res.json(meeting);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map((e) => e.message),
      });
    }
    console.error('Update meeting error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting not found.' });
    }
    res.status(500).json({ message: 'Server error updating meeting' });
  }
};

module.exports = {
  createFromText,
  createFromFile,
  createMeetingFromAudio,
  createMeetingFromVideo,
  getMeetings,
  getMeetingById,
  deleteMeeting,
  updateMeeting,
};

