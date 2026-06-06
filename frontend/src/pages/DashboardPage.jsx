import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-white">
            Welcome back, <span className="text-indigo-400">{user?.name}</span>
          </h2>
          <p className="text-sm text-white/40 mt-1">Your meetings will appear here.</p>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <p className="text-white/50 text-sm">No meetings yet</p>
          <p className="text-white/25 text-xs mt-1">Create your first meeting to get started</p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
