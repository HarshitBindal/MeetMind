import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await api.get('/meetings');
        setMeetings(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load meetings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Input type icon and color mapping
  const inputTypeDisplay = {
    transcript: { icon: '✏️', label: 'Text', color: 'indigo' },
    transcript_file: { icon: '📄', label: 'File', color: 'emerald' },
    audio: { icon: '🎙️', label: 'Audio', color: 'purple' },
    video: { icon: '🎬', label: 'Video', color: 'blue' },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Meet<span className="text-indigo-400">Mind</span>
          </h1>

          <div className="flex items-center gap-6">
            <Link 
              to="/meetings/new" 
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-colors"
            >
              + New Meeting
            </Link>
            
            <div className="flex items-center gap-3 border-l border-white/[0.06] pl-6">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-300">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-white/60 hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-white/40 hover:text-white/80 transition-colors duration-200 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Welcome back, <span className="text-indigo-400">{user?.name}</span>
            </h2>
            <p className="text-sm text-white/40 mt-1">
              {meetings.length > 0
                ? `You have ${meetings.length} meeting${meetings.length === 1 ? '' : 's'}`
                : 'Your meetings will appear here.'
              }
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 text-white/50">
              <span className="w-5 h-5 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
              Loading meetings...
            </div>
          </div>
        ) : meetings.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-[fadeIn_0.3s_ease-out]">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-white/50 text-sm">No meetings yet</p>
            <p className="text-white/25 text-xs mt-1 mb-6">Create your first meeting to get started</p>
            <Link
              to="/meetings/new"
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg transition-colors"
            >
              + Create Meeting
            </Link>
          </div>
        ) : (
          /* Meeting cards grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-[fadeIn_0.3s_ease-out]">
            {meetings.map((meeting) => {
              const typeInfo = inputTypeDisplay[meeting.inputType] || { icon: '📋', label: meeting.inputType, color: 'gray' };
              const actionCount = meeting.actionItems?.length || 0;
              const decisionCount = meeting.decisions?.length || 0;

              return (
                <Link
                  key={meeting._id}
                  to={`/meetings/${meeting._id}`}
                  className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 cursor-pointer"
                >
                  {/* Top row: type badge + date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-${typeInfo.color}-500/10 text-${typeInfo.color}-300 border border-${typeInfo.color}-500/20`}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    <span className="text-xs text-white/30">
                      {new Date(meeting.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-medium text-white mb-3 group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {meeting.title}
                  </h3>

                  {/* Summary preview */}
                  <p className="text-sm text-white/40 mb-4 line-clamp-2 leading-relaxed">
                    {meeting.summary || 'No summary available.'}
                  </p>

                  {/* Bottom stats */}
                  <div className="flex items-center gap-4 pt-4 border-t border-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {actionCount} action{actionCount !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                      {decisionCount} decision{decisionCount !== 1 ? 's' : ''}
                    </div>
                    {meeting.status === 'processed' && (
                      <span className="ml-auto text-xs text-green-400/60">✓ Processed</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
