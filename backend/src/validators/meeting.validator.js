const { z } = require('zod');

/**
 * Validation schema for creating a meeting via pasted transcript.
 * Enforces a title and non-empty transcript text.
 */
const createTranscriptMeetingSchema = z.object({
  title: z
    .string({ required_error: 'Meeting title is required' })
    .min(1, 'Meeting title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  transcript: z
    .string({ required_error: 'Transcript text is required' })
    .min(10, 'Transcript is too short to extract meaningful data')
    .trim(),
});

module.exports = { createTranscriptMeetingSchema };
