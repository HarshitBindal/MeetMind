const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Point fluent-ffmpeg to the bundled ffmpeg binary (cross-platform, no manual install)
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Extracts the audio track from a video file and saves it as an .mp3 file.
 *
 * Uses the ffmpeg binary bundled by @ffmpeg-installer/ffmpeg, so there is
 * no need to install ffmpeg globally on the host machine.
 *
 * @param {string} videoPath - Absolute path to the uploaded video file.
 * @returns {Promise<string>} Absolute path to the extracted .mp3 audio file.
 */
const extractAudioFromVideo = (videoPath) => {
  // Build the output path: same directory, same base name, but .mp3 extension
  const outputAudioPath = videoPath.replace(path.extname(videoPath), '.mp3');

  return new Promise((resolve, reject) => {
    console.log(`[Video] Extracting audio from: ${path.basename(videoPath)}`);

    ffmpeg(videoPath)
      .noVideo()                   // Strip the video track entirely
      .audioCodec('libmp3lame')    // Encode audio as MP3
      .audioBitrate(128)           // 128 kbps — good enough for speech
      .on('end', () => {
        console.log(`[Video] Audio extraction complete: ${path.basename(outputAudioPath)}`);
        resolve(outputAudioPath);
      })
      .on('error', (err) => {
        console.error('[Video] ffmpeg error:', err.message);
        reject(new Error(`Failed to extract audio from video: ${err.message}`));
      })
      .save(outputAudioPath);
  });
};

module.exports = { extractAudioFromVideo };
