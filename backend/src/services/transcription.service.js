const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// Reuse the same Gemini client (reads GEMINI_API_KEY from process.env)
const ai = new GoogleGenAI({});

/**
 * Transcribes an audio file using the Gemini File API.
 *
 * Flow:
 *  1. Upload the local audio file to Gemini's temporary storage.
 *  2. Wait until the file is in an ACTIVE state (ready for inference).
 *  3. Prompt Gemini to produce a verbatim transcript from the audio.
 *  4. Delete the file from Gemini's storage after transcription.
 *  5. Return the raw transcript text.
 *
 * This keeps us within the Google ecosystem and avoids OpenAI Whisper costs.
 *
 * @param {string} filePath - Absolute path to the local audio file.
 * @param {string} mimeType - The MIME type of the audio (e.g. 'audio/mpeg').
 * @returns {Promise<string>} The verbatim transcript text.
 */
const transcribeAudio = async (filePath, mimeType) => {
  let uploadedFile = null;

  try {
    // 1. Upload the audio file to Gemini
    console.log(`[Transcription] Uploading audio file: ${path.basename(filePath)}`);
    uploadedFile = await ai.files.upload({
      file: filePath,
      config: { mimeType },
    });

    // 2. Poll until the file is processed and ACTIVE
    let file = uploadedFile;
    while (file.state === 'PROCESSING') {
      console.log('[Transcription] File is still processing, waiting...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      file = await ai.files.get({ name: file.name });
    }

    if (file.state === 'FAILED') {
      throw new Error('Gemini failed to process the uploaded audio file.');
    }

    // 3. Prompt Gemini to transcribe the audio verbatim
    console.log('[Transcription] File ready. Requesting transcript from Gemini...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                fileUri: file.uri,
                mimeType: file.mimeType,
              },
            },
            {
              text: 'Transcribe this audio exactly as spoken, word for word. Do not add any extra commentary, headings, or formatting. Return only the raw transcript text.',
            },
          ],
        },
      ],
    });

    const transcript = response.text;

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Gemini returned an empty transcript.');
    }

    console.log(`[Transcription] Success — transcript length: ${transcript.length} chars`);
    return transcript.trim();
  } catch (error) {
    console.error('[Transcription] Error:', error.message);
    throw new Error(`Audio transcription failed: ${error.message}`);
  } finally {
    // 4. Clean up: delete the file from Gemini's storage
    if (uploadedFile?.name) {
      try {
        await ai.files.delete({ name: uploadedFile.name });
        console.log('[Transcription] Cleaned up Gemini file storage.');
      } catch (cleanupErr) {
        console.error('[Transcription] Failed to delete Gemini file:', cleanupErr.message);
      }
    }
  }
};

module.exports = { transcribeAudio };
