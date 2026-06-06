const mongoose = require('mongoose');

/**
 * Sub-schema for individual action items.
 * Each action item has a task description, an owner (person responsible),
 * and an optional deadline string.
 */
const actionItemSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
    },
    owner: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    deadline: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true } // Each action item gets its own _id for individual editing/deletion
);

/**
 * Main Meeting schema.
 *
 * Represents a single meeting record created by a user.
 * Supports 4 input types: pasted transcript, transcript file, audio, and video.
 * Stores both the raw input and the AI-extracted structured output.
 */
const meetingSchema = new mongoose.Schema(
  {
    // Which user owns this meeting
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // User-provided title for the meeting
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // How was this meeting created?
    inputType: {
      type: String,
      required: true,
      enum: {
        values: ['transcript', 'transcript_file', 'audio', 'video'],
        message: '{VALUE} is not a valid input type',
      },
    },

    // The original transcript text (pasted directly or extracted from file/audio/video).
    // select: false — excluded from list queries for performance, loaded on detail view.
    rawText: {
      type: String,
      default: '',
      select: false,
    },

    // Original file name (for file/audio/video uploads)
    sourceFileName: {
      type: String,
      default: '',
    },

    // ---- AI-extracted fields ----

    // Summary of the meeting
    summary: {
      type: String,
      default: '',
    },

    // Structured action items extracted by AI
    actionItems: {
      type: [actionItemSchema],
      default: [],
    },

    // Key decisions made during the meeting
    decisions: {
      type: [String],
      default: [],
    },

    // ---- Processing status ----

    // Tracks where the meeting is in the processing pipeline
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
    },

    // If processing failed, store the reason here
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for faster queries: get all meetings for a user, newest first
meetingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Meeting', meetingSchema);
