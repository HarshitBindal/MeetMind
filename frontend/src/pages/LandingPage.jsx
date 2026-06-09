import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: '✏️',
      title: 'Paste Transcript',
      description: 'Drop in a raw meeting transcript and get structured insights in seconds.',
      color: 'indigo',
    },
    {
      icon: '📄',
      title: 'Upload Files',
      description: 'Upload .txt, .md, or .pdf transcript files for instant AI extraction.',
      color: 'emerald',
    },
    {
      icon: '🎙️',
      title: 'Audio Analysis',
      description: 'Upload audio recordings — we transcribe and extract key points automatically.',
      color: 'purple',
    },
    {
      icon: '🎬',
      title: 'Video Processing',
      description: 'Upload video files — audio is extracted, transcribed, and analyzed by AI.',
      color: 'blue',
    },
  ];

  const steps = [
    { number: '01', title: 'Upload', description: 'Paste text or upload a file, audio, or video recording of your meeting.' },
    { number: '02', title: 'Extract', description: 'Our AI analyzes the content and extracts summaries, action items, and decisions.' },
    { number: '03', title: 'Review', description: 'View, edit, and manage your structured meeting insights from a clean dashboard.' },
  ];

  // Color mappings for feature cards — Tailwind can't resolve dynamic classes, so we map explicitly
  const colorMap = {
    indigo: {
      iconBg: 'bg-indigo-500/10',
      iconBorder: 'border-indigo-500/20',
      iconText: 'text-indigo-400',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10',
      iconBorder: 'border-emerald-500/20',
      iconText: 'text-emerald-400',
    },
    purple: {
      iconBg: 'bg-purple-500/10',
      iconBorder: 'border-purple-500/20',
      iconText: 'text-purple-400',
    },
    blue: {
      iconBg: 'bg-blue-500/10',
      iconBorder: 'border-blue-500/20',
      iconText: 'text-blue-400',
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* ── Ambient background glows ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-purple-500/[0.05] rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            Meet<span className="text-indigo-400">Mind</span>
          </h1>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg transition-colors duration-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg transition-colors duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20 text-center animate-[fadeIn_0.6s_ease-out]">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-medium text-indigo-300 tracking-wide">AI-Powered Meeting Intelligence</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          Turn meetings into
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            actionable insights
          </span>
        </h2>

        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload a transcript, audio, or video — MeetMind uses AI to extract summaries,
          action items, and key decisions so nothing falls through the cracks.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="group relative inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
          >
            Start for Free
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            to="/login"
            className="px-8 py-3.5 text-sm font-medium text-white/70 bg-white/[0.04] border border-white/[0.08] rounded-xl hover:bg-white/[0.08] hover:text-white transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-3">
            Every meeting format, one pipeline
          </h3>
          <p className="text-white/40 max-w-lg mx-auto">
            Whether it&apos;s a pasted transcript or a raw video file, MeetMind handles it all with a single unified AI pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature) => {
            const colors = colorMap[feature.color];
            return (
              <div
                key={feature.title}
                className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-xl">{feature.icon}</span>
                </div>
                <h4 className="text-base font-medium text-white mb-2">{feature.title}</h4>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-3">
            How it works
          </h3>
          <p className="text-white/40 max-w-lg mx-auto">
            Three simple steps to transform raw meeting content into structured, reviewable insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center group">
              {/* Connector line (between cards on desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-white/[0.08] to-transparent" />
              )}

              <div className="relative z-10 mb-4">
                <span className="text-3xl font-bold bg-gradient-to-b from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                  {step.number}
                </span>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">{step.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-10 sm:p-14 backdrop-blur-sm">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-4">
            Ready to make meetings
            <span className="text-indigo-400"> productive</span>?
          </h3>
          <p className="text-white/40 mb-8 max-w-md mx-auto">
            Stop losing track of action items and decisions. Let AI handle the busywork.
          </p>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
          >
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-white/30">
            © {new Date().getFullYear()} MeetMind. All rights reserved.
          </span>
          <span className="text-sm font-medium text-white/40">
            Meet<span className="text-indigo-400/60">Mind</span>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
