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

/**
 * Validation schema for updating a meeting.
 * All fields are optional — only provided fields will be updated.
 */
const updateMeetingSchema = z.object({
  title: z
    .string()
    .min(1, 'Meeting title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),
  summary: z
    .string()
    .trim()
    .optional(),
  actionItems: z
    .array(
      z.object({
        task: z.string().min(1, 'Task description is required').trim(),
        owner: z.string().trim().optional().default('Unassigned'),
        deadline: z.string().trim().optional().default(''),
      })
    )
    .optional(),
  decisions: z
    .array(z.string().trim())
    .optional(),
});

module.exports = { createTranscriptMeetingSchema, updateMeetingSchema };
