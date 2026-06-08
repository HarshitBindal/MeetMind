import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const MeetingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await api.get(`/meetings/${id}`);
        setMeeting(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load meeting.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeeting();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/meetings/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete meeting.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Input type icon and label
  const inputTypeDisplay = {
    transcript: { icon: '✏️', label: 'Pasted Text' },
    transcript_file: { icon: '📄', label: 'File Upload' },
    audio: { icon: '🎙️', label: 'Audio' },
    video: { icon: '🎬', label: 'Video' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/50">
          <span className="w-5 h-5 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
          Loading meeting...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-md text-center">
          {error}
        </div>
        <Link to="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const typeInfo = inputTypeDisplay[meeting.inputType] || { icon: '📋', label: meeting.inputType };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            Meet<span className="text-indigo-400">Mind</span>
          </Link>
          <Link to="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{meeting.title}</h1>
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span>{typeInfo.icon} {typeInfo.label}</span>
              <span>•</span>
              <span>{new Date(meeting.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}</span>
              {meeting.sourceFileName && (
                <>
                  <span>•</span>
                  <span className="text-white/30">{meeting.sourceFileName}</span>
                </>
              )}
            </div>
          </div>

          {/* Delete button */}
          <div className="relative">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
              >
                Delete Meeting
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                <span className="text-sm text-white/50">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-500 transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm text-white/50 bg-white/[0.05] rounded-lg hover:bg-white/[0.1] transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — AI Insights (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-3 text-indigo-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                Summary
              </h2>
              <p className="text-white/80 leading-relaxed">{meeting.summary || 'No summary available.'}</p>
            </div>

            {/* Action Items */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-4 text-purple-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Action Items
                {meeting.actionItems?.length > 0 && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                    {meeting.actionItems.length}
                  </span>
                )}
              </h2>
              {meeting.actionItems?.length > 0 ? (
                <ul className="space-y-3">
                  {meeting.actionItems.map((item, i) => (
                    <li key={item._id || i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-white/[0.03] rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                      <span className="text-white/90">{item.task}</span>
                      <div className="flex items-center gap-3 text-xs flex-shrink-0">
                        <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-300">
                          👤 {item.owner || 'Unassigned'}
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
              <h2 className="text-lg font-medium mb-3 text-blue-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                Key Decisions
                {meeting.decisions?.length > 0 && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                    {meeting.decisions.length}
                  </span>
                )}
              </h2>
              {meeting.decisions?.length > 0 ? (
                <ul className="space-y-2">
                  {meeting.decisions.map((decision, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                      <span className="text-blue-400 mt-0.5">✦</span>
                      <span className="text-white/80">{decision}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/40 italic">No key decisions detected.</p>
              )}
            </div>
          </div>

          {/* Right column — Transcript (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 lg:sticky lg:top-6">
              <h2 className="text-lg font-medium mb-3 text-emerald-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Original Transcript
              </h2>
              {meeting.rawText ? (
                <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{meeting.rawText}</p>
                </div>
              ) : (
                <p className="text-white/40 italic text-sm">Transcript not available.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MeetingDetailPage;
