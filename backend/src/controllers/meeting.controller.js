const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Meeting = require('../models/Meeting');
const { extractMeetingData } = require('../services/ai.service');
const { transcribeAudio } = require('../services/transcription.service');
const { extractAudioFromVideo } = require('../services/video.service');
const { createTranscriptMeetingSchema } = require('../validators/meeting.validator');

/**
 * @desc    Create a meeting from pasted transcript text
 * @route   POST /api/meetings/text
 * @access  Private
 */
const createFromText = async (req, res) => {
  try {
    // 1. Validate request body
    const { title, transcript } = createTranscriptMeetingSchema.parse(req.body);

    // 2. Call Gemini AI to extract structured data synchronously
    const aiData = await extractMeetingData(transcript);

    // 3. Create and save the meeting record in MongoDB
    const meeting = await Meeting.create({
      userId: req.user._id,
      title,
      inputType: 'transcript',
      rawText: transcript,
      summary: aiData.summary,
      actionItems: aiData.actionItems,
      decisions: aiData.decisions,
      status: 'processed', // Automatically processed since it's synchronous text
    });

    // 4. Return the completed meeting object (without rawText due to select: false, but we can return it if needed)
    // We'll re-fetch to apply the select rules properly, or just return the object.
    const savedMeeting = await Meeting.findById(meeting._id);

    res.status(201).json(savedMeeting);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map((e) => e.message),
      });
    }
    console.error('Meeting processing error:', error);
    res.status(500).json({ message: error.message || 'Server error processing meeting' });
  }
};

/**
 * @desc    Create a meeting from an uploaded transcript file (.txt, .md, or .pdf)
 * @route   POST /api/meetings/file
 * @access  Private
 */
const createFromFile = async (req, res) => {
  let filePath = null;

  try {
    // 1. Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please upload a .txt, .md, or .pdf file.' });
    }

    filePath = req.file.path;
    const title = req.body.title;

    // 2. Validate title
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Meeting title is required.' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ message: 'Title cannot exceed 200 characters.' });
    }

    // 3. Read the file content — use pdf-parse for PDFs, plain read for text files
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rawText;

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text;
    } else {
      rawText = fs.readFileSync(filePath, 'utf-8');
    }

    // 4. Sanitize: trim whitespace and check minimum length
    const trimmedText = rawText.trim();
    if (trimmedText.length < 10) {
      return res.status(400).json({ message: 'File content is too short to extract meaningful data.' });
    }

    // 5. Send to the SAME extraction pipeline as pasted transcript
    const aiData = await extractMeetingData(trimmedText);

    // 6. Create the meeting record in MongoDB
    const meeting = await Meeting.create({
      userId: req.user._id,
      title: title.trim(),
      inputType: 'transcript_file',
      rawText: trimmedText,
      sourceFileName: req.file.originalname,
      summary: aiData.summary,
      actionItems: aiData.actionItems,
      decisions: aiData.decisions,
      status: 'processed',
    });

    const savedMeeting = await Meeting.findById(meeting._id);
    res.status(201).json(savedMeeting);
  } catch (error) {
    console.error('File meeting processing error:', error);
    res.status(500).json({ message: error.message || 'Server error processing uploaded file' });
  } finally {
    // 7. Always delete the temporary uploaded file
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.error('Failed to clean up temp file:', cleanupErr);
      }
    }
  }
};

/**
 * @desc    Create a meeting from an uploaded audio file
 * @route   POST /api/meetings/audio
 * @access  Private
 */
const createMeetingFromAudio = async (req, res) => {
  let filePath = null;

  try {
    // 1. Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded. Please upload an .mp3, .wav, .m4a, or .webm file.' });
    }

    filePath = req.file.path;
    const title = req.body.title;

    // 2. Validate title
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Meeting title is required.' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ message: 'Title cannot exceed 200 characters.' });
    }

    // 3. Transcribe the audio using Gemini File API
    const rawTranscript = await transcribeAudio(filePath, req.file.mimetype);

    // 4. Validate transcript length
    if (rawTranscript.length < 10) {
      return res.status(400).json({ message: 'Audio transcript is too short to extract meaningful data.' });
    }

    // 5. Send transcript to the SAME extraction pipeline as pasted text / file upload
    const aiData = await extractMeetingData(rawTranscript);

    // 6. Create the meeting record in MongoDB
    const meeting = await Meeting.create({
      userId: req.user._id,
      title: title.trim(),
      inputType: 'audio',
      rawText: rawTranscript,
      sourceFileName: req.file.originalname,
      summary: aiData.summary,
      actionItems: aiData.actionItems,
      decisions: aiData.decisions,
      status: 'processed',
    });

    const savedMeeting = await Meeting.findById(meeting._id);
    res.status(201).json(savedMeeting);
  } catch (error) {
    console.error('Audio meeting processing error:', error);
    res.status(500).json({ message: error.message || 'Server error processing audio file' });
  } finally {
    // 7. Always delete the temporary uploaded audio file
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.error('Failed to clean up temp audio file:', cleanupErr);
      }
    }
  }
};

/**
 * @desc    Create a meeting from an uploaded video file
 * @route   POST /api/meetings/video
 * @access  Private
 */
const createMeetingFromVideo = async (req, res) => {
  let videoPath = null;
  let extractedAudioPath = null;

  try {
    // 1. Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded. Please upload an .mp4, .mov, or .webm file.' });
    }

    videoPath = req.file.path;
    const title = req.body.title;

    // 2. Validate title
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Meeting title is required.' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ message: 'Title cannot exceed 200 characters.' });
    }

    // 3. Extract audio from the video using ffmpeg
    extractedAudioPath = await extractAudioFromVideo(videoPath);

    // 4. Transcribe the extracted audio using Gemini File API
    const rawTranscript = await transcribeAudio(extractedAudioPath, 'audio/mpeg');

    // 5. Validate transcript length
    if (rawTranscript.length < 10) {
      return res.status(400).json({ message: 'Video audio transcript is too short to extract meaningful data.' });
    }

    // 6. Send transcript to the SAME extraction pipeline
    const aiData = await extractMeetingData(rawTranscript);

    // 7. Create the meeting record in MongoDB
    const meeting = await Meeting.create({
      userId: req.user._id,
      title: title.trim(),
      inputType: 'video',
      rawText: rawTranscript,
      sourceFileName: req.file.originalname,
      summary: aiData.summary,
      actionItems: aiData.actionItems,
      decisions: aiData.decisions,
      status: 'processed',
    });

    const savedMeeting = await Meeting.findById(meeting._id);
    res.status(201).json(savedMeeting);
  } catch (error) {
    console.error('Video meeting processing error:', error);
    res.status(500).json({ message: error.message || 'Server error processing video file' });
  } finally {
    // 8. Always clean up BOTH temp files — video and extracted audio
    if (videoPath) {
      try {
        fs.unlinkSync(videoPath);
      } catch (cleanupErr) {
        console.error('Failed to clean up temp video file:', cleanupErr);
      }
    }
    if (extractedAudioPath) {
      try {
        fs.unlinkSync(extractedAudioPath);
      } catch (cleanupErr) {
        console.error('Failed to clean up temp extracted audio file:', cleanupErr);
      }
    }
  }
};

module.exports = { createFromText, createFromFile, createMeetingFromAudio, createMeetingFromVideo };
