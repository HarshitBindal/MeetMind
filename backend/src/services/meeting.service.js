const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Meeting = require('../models/Meeting');
const { extractMeetingData } = require('./ai.service');
const { transcribeAudio } = require('./transcription.service');
const { extractAudioFromVideo } = require('./video.service');

/**
 * Safely deletes a file from disk. Silently ignores errors
 * (e.g. file already deleted or never created).
 *
 * @param {string|null} filePath - Absolute path to the file to delete.
 */
const safeDelete = (filePath) => {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(`[Cleanup] Failed to delete ${path.basename(filePath)}:`, err.message);
  }
};

/**
 * Reads the text content from an uploaded transcript file.
 * Supports .txt, .md (plain read) and .pdf (via pdf-parse).
 *
 * @param {string} filePath - Absolute path to the uploaded file.
 * @param {string} originalName - Original filename (used to detect extension).
 * @returns {Promise<string>} The trimmed text content of the file.
 */
const readTranscriptFile = async (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  let rawText;

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    rawText = pdfData.text;
  } else {
    rawText = fs.readFileSync(filePath, 'utf-8');
  }

  return rawText.trim();
};

/**
 * Unified meeting processing pipeline.
 *
 * Accepts any of the 4 input types and orchestrates the full flow:
 *   1. Obtain the raw transcript text (directly, from file, from audio, or from video).
 *   2. Send the transcript to the AI extraction service.
 *   3. Save the meeting record to MongoDB.
 *   4. Clean up all temporary files.
 *
 * @param {Object} params
 * @param {string} params.userId     - The authenticated user's MongoDB _id.
 * @param {string} params.title      - The meeting title (already validated by controller).
 * @param {string} params.inputType  - One of: 'transcript', 'transcript_file', 'audio', 'video'.
 * @param {string} [params.rawText]  - The pasted transcript text (only for inputType 'transcript').
 * @param {Object} [params.file]     - The Multer file object (for file/audio/video uploads).
 * @returns {Promise<Object>} The saved Meeting document (re-fetched to apply select rules).
 */
const processMeetingInput = async ({ userId, title, inputType, rawText, file }) => {
  // Track all temporary files that need cleanup
  const tempFiles = [];

  try {
    let transcript;
    let sourceFileName = '';

    switch (inputType) {
      // ── Pasted transcript text ──
      case 'transcript': {
        transcript = rawText;
        break;
      }

      // ── Uploaded transcript file (.txt, .md, .pdf) ──
      case 'transcript_file': {
        tempFiles.push(file.path);
        sourceFileName = file.originalname;
        transcript = await readTranscriptFile(file.path, file.originalname);
        break;
      }

      // ── Uploaded audio file (.mp3, .wav, .m4a, .webm) ──
      case 'audio': {
        tempFiles.push(file.path);
        sourceFileName = file.originalname;
        transcript = await transcribeAudio(file.path, file.mimetype);
        break;
      }

      // ── Uploaded video file (.mp4, .mov, .webm) ──
      case 'video': {
        tempFiles.push(file.path); // Original video file

        sourceFileName = file.originalname;

        // Extract audio track from video
        const extractedAudioPath = await extractAudioFromVideo(file.path);
        tempFiles.push(extractedAudioPath); // Extracted audio file

        // Transcribe the extracted audio
        transcript = await transcribeAudio(extractedAudioPath, 'audio/mpeg');
        break;
      }

      default:
        throw new Error(`Unsupported input type: ${inputType}`);
    }

    // ── Validate transcript length ──
    if (!transcript || transcript.trim().length < 10) {
      throw new Error('Transcript is too short to extract meaningful data.');
    }

    // ── AI Extraction ──
    const aiData = await extractMeetingData(transcript.trim());

    // ── Save to MongoDB ──
    const meeting = await Meeting.create({
      userId,
      title,
      inputType,
      rawText: transcript.trim(),
      sourceFileName,
      summary: aiData.summary,
      actionItems: aiData.actionItems,
      decisions: aiData.decisions,
      status: 'processed',
    });

    // Re-fetch to apply schema select rules (e.g. rawText: select: false)
    const savedMeeting = await Meeting.findById(meeting._id);
    return savedMeeting;
  } finally {
    // ── Always clean up ALL temporary files ──
    tempFiles.forEach(safeDelete);
  }
};

module.exports = { processMeetingInput };
