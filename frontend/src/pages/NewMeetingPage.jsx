import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const NewMeetingPage = () => {
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [file, setFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [inputMode, setInputMode] = useState('paste'); // 'paste', 'file', 'audio', or 'video'
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf'];
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
  const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm'];
  const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB
  const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate extension
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('Only .txt, .md, and .pdf files are allowed.');
      setFile(null);
      e.target.value = '';
      return;
    }

    // Validate size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 2 MB.');
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleAudioChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');

    if (!selectedFile) {
      setAudioFile(null);
      return;
    }

    // Validate extension
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      setError('Only .mp3, .wav, .m4a, and .webm audio files are allowed.');
      setAudioFile(null);
      e.target.value = '';
      return;
    }

    // Validate size
    if (selectedFile.size > MAX_AUDIO_SIZE) {
      setError('Audio file is too large. Maximum size is 25 MB.');
      setAudioFile(null);
      e.target.value = '';
      return;
    }

    setAudioFile(selectedFile);
  };

  const handleVideoChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');

    if (!selectedFile) {
      setVideoFile(null);
      return;
    }

    // Validate extension
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
      setError('Only .mp4, .mov, and .webm video files are allowed.');
      setVideoFile(null);
      e.target.value = '';
      return;
    }

    // Validate size
    if (selectedFile.size > MAX_VIDEO_SIZE) {
      setError('Video file is too large. Maximum size is 50 MB.');
      setVideoFile(null);
      e.target.value = '';
      return;
    }

    setVideoFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Meeting title is required.');
      return;
    }

    if (inputMode === 'paste' && transcript.trim().length < 10) {
      setError('Transcript is too short to extract meaningful data.');
      return;
    }

    if (inputMode === 'file' && !file) {
      setError('Please select a transcript file to upload.');
      return;
    }

    if (inputMode === 'audio' && !audioFile) {
      setError('Please select an audio file to upload.');
      return;
    }

    if (inputMode === 'video' && !videoFile) {
      setError('Please select a video file to upload.');
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (inputMode === 'paste') {
        setLoadingMessage('Extracting AI insights...');
        response = await api.post('/meetings/text', { title, transcript });
      } else if (inputMode === 'file') {
        setLoadingMessage('Processing file...');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('transcriptFile', file);
        response = await api.post('/meetings/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (inputMode === 'audio') {
        setLoadingMessage('Transcribing audio... this may take a minute');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('audioFile', audioFile);
        response = await api.post('/meetings/audio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (inputMode === 'video') {
        setLoadingMessage('Extracting audio from video & transcribing...');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('videoFile', videoFile);
        response = await api.post('/meetings/video', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Failed to process meeting.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setTitle('');
    setTranscript('');
    setFile(null);
    setAudioFile(null);
    setVideoFile(null);
    setError('');
    setLoadingMessage('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            Meet<span className="text-indigo-400">Mind</span>
          </Link>
          <Link to="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {!result ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-semibold mb-2">New Meeting</h1>
              <p className="text-white/50">Paste a transcript, upload a file, audio, or video to extract insights.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-[fadeIn_0.2s_ease-out]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all placeholder-white/20"
                  placeholder="e.g. Q3 Roadmap Planning"
                />
              </div>

              {/* Input Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Input Method</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('paste')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMode === 'paste'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    ✏️ Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMode === 'file'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    📄 Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('audio')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMode === 'audio'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    🎙️ Upload Audio
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('video')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMode === 'video'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    🎬 Upload Video
                  </button>
                </div>
              </div>

              {/* Paste Mode */}
              {inputMode === 'paste' && (
                <div className="animate-[fadeIn_0.2s_ease-out]">
                  <label className="block text-sm font-medium text-white/70 mb-2">Transcript Text</label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all placeholder-white/20 resize-y"
                    placeholder="Paste the raw meeting transcript here..."
                  />
                </div>
              )}

              {/* File Mode */}
              {inputMode === 'file' && (
                <div className="animate-[fadeIn_0.2s_ease-out]">
                  <label className="block text-sm font-medium text-white/70 mb-2">Transcript File</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".txt,.md,.pdf"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-white/60
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-indigo-600 file:text-white
                        hover:file:bg-indigo-500
                        file:cursor-pointer file:transition-colors
                        bg-white/[0.03] border border-white/[0.08] rounded-xl
                        cursor-pointer p-3"
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/30">Supported: .txt, .md, .pdf — Max size: 2 MB</p>

                  {/* Selected file info */}
                  {file && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm animate-[fadeIn_0.2s_ease-out]">
                      <span className="text-indigo-300">📄</span>
                      <span className="text-white/80">{file.name}</span>
                      <span className="text-white/30 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Audio Mode */}
              {inputMode === 'audio' && (
                <div className="animate-[fadeIn_0.2s_ease-out]">
                  <label className="block text-sm font-medium text-white/70 mb-2">Audio File</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".mp3,.wav,.m4a,.webm,audio/*"
                      onChange={handleAudioChange}
                      className="block w-full text-sm text-white/60
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-indigo-600 file:text-white
                        hover:file:bg-indigo-500
                        file:cursor-pointer file:transition-colors
                        bg-white/[0.03] border border-white/[0.08] rounded-xl
                        cursor-pointer p-3"
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/30">Supported: .mp3, .wav, .m4a, .webm — Max size: 25 MB</p>

                  {/* Selected audio file info */}
                  {audioFile && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm animate-[fadeIn_0.2s_ease-out]">
                      <span className="text-indigo-300">🎙️</span>
                      <span className="text-white/80">{audioFile.name}</span>
                      <span className="text-white/30 text-xs">({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Video Mode */}
              {inputMode === 'video' && (
                <div className="animate-[fadeIn_0.2s_ease-out]">
                  <label className="block text-sm font-medium text-white/70 mb-2">Video File</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".mp4,.mov,.webm,video/*"
                      onChange={handleVideoChange}
                      className="block w-full text-sm text-white/60
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-indigo-600 file:text-white
                        hover:file:bg-indigo-500
                        file:cursor-pointer file:transition-colors
                        bg-white/[0.03] border border-white/[0.08] rounded-xl
                        cursor-pointer p-3"
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/30">Supported: .mp4, .mov, .webm — Max size: 50 MB</p>

                  {/* Selected video file info */}
                  {videoFile && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm animate-[fadeIn_0.2s_ease-out]">
                      <span className="text-indigo-300">🎬</span>
                      <span className="text-white/80">{videoFile.name}</span>
                      <span className="text-white/30 text-xs">({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {loadingMessage || 'Processing...'}
                    </>
                  ) : (
                    'Process Meeting'
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* ── Results View ── */
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Extraction Complete</h2>
                <p className="text-white/50">{result.title}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-medium mb-3 text-indigo-400">Summary</h3>
                <p className="text-white/80 leading-relaxed">{result.summary}</p>
              </div>

              {/* Action Items */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-medium mb-4 text-purple-400">Action Items</h3>
                {result.actionItems?.length > 0 ? (
                  <ul className="space-y-3">
                    {result.actionItems.map((item, i) => (
                      <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                        <span className="text-white/90">{item.task}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-300">
                            👤 {item.owner}
                          </span>
                          {item.deadline && (
                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-300">
                              ⏱️ {item.deadline}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/40 italic">No action items detected.</p>
                )}
              </div>

              {/* Decisions */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-medium mb-3 text-blue-400">Key Decisions</h3>
                {result.decisions?.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-white/80">
                    {result.decisions.map((decision, i) => (
                      <li key={i}>{decision}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/40 italic">No key decisions detected.</p>
                )}
              </div>
              
              <div className="pt-6">
                <button 
                  onClick={resetForm}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  ← Extract another meeting
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewMeetingPage;
