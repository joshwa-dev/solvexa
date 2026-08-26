import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LandingPage() {
  const { signInAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleLaunchDemo = () => {
    signInAsGuest();
    navigate('/pulse');
  };

  const featurePillars = [
    {
      icon: 'sensors',
      title: 'Resonant Signal Flow',
      desc: 'Move beyond vanity metrics. React with 6 nuanced signals: Insight, Resonate, Spark, Echo, Prism, and Beacon.',
      gradient: 'from-purple-500/20 to-indigo-500/20',
      border: 'border-purple-500/30'
    },
    {
      icon: 'play_circle',
      title: 'Vertical Signals Stream',
      desc: 'Immersive short-form technical demos, spatial shaders, and neural workflows rendered with zero visual clutter.',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/30'
    },
    {
      icon: 'all_inclusive',
      title: 'Dynamic Orbit Radar',
      desc: 'Visualize your intellectual sphere. Map mutual resonators, close research circles, and emergent thinkers.',
      gradient: 'from-violet-500/20 to-fuchsia-500/20',
      border: 'border-violet-500/30'
    },
    {
      icon: 'hub',
      title: 'Synthesized Spaces',
      desc: 'High-density hubs built around AI architectures, quantum physics, spatial computing, and open protocols.',
      gradient: 'from-blue-500/20 to-emerald-500/20',
      border: 'border-blue-500/30'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col relative overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/[0.06] backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center signal-glow shadow-lg shadow-purple-900/30"
            style={{ background: 'linear-gradient(135deg, #7a00ff, #0066ff)' }}
          >
            <span className="material-symbols-outlined text-white text-2xl icon-filled">
              sensors
            </span>
          </div>
          <span
            className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #a078ff, #4cd7f6)' }}
          >
            Solvexa
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <button
            onClick={handleLaunchDemo}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-95 transition-all shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Launch Demo Flow
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-primary mb-8 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-500">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>SOLVEXA 3.0 • SIGNAL FLOW ACTIVE</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          YOUR WORLD.{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #a078ff, #4cd7f6, #adc6ff)' }}
          >
            YOUR SIGNAL.
          </span>
        </h1>

        <p className="text-base md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-10">
          The next-generation social intelligence network. Unfiltered resonance,
          deep technical discussions, volumetric glassmorphism, and decentralized idea discovery.
        </p>

        {/* CTA Group */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <button
            onClick={handleLaunchDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#7a00ff] via-[#4f46e5] to-[#0066ff] hover:opacity-90 transition-all shadow-xl shadow-purple-900/50 flex items-center justify-center gap-3 group"
          >
            <span className="material-symbols-outlined text-xl group-hover:animate-pulse">sensors</span>
            <span>Enter Signal Flow (Instant Demo)</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>

          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-[#141416] hover:bg-[#1c1b1c] border border-white/15 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            <span>Create Free Account</span>
          </Link>
        </div>

        {/* Live Metrics Showcase */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mb-20">
          {[
            { metric: '99.98%', label: 'Signal Fidelity' },
            { metric: '6 Types', label: 'Cognitive Signals' },
            { metric: '100% Real-time', label: 'WebSocket Tomography' },
            { metric: '< 5ms', label: 'Mesh Transmission' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-[#141416]/70 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 text-center hover:border-primary/40 transition-colors"
            >
              <div className="text-2xl md:text-3xl font-extrabold text-white mb-1 bg-clip-text text-transparent bg-gradient-to-r from-primary to-tertiary">
                {item.metric}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
          {featurePillars.map((p, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-2xl bg-gradient-to-br ${p.gradient} bg-[#141416]/90 border ${p.border} backdrop-blur-xl relative overflow-hidden group hover:scale-[1.01] transition-all`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">{p.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <div>© 2026 Solvexa Network. All signals reserved.</div>
        <div className="flex items-center gap-6">
          <span className="hover:text-zinc-300 cursor-pointer">Protocol</span>
          <span className="hover:text-zinc-300 cursor-pointer">Privacy System</span>
          <span className="hover:text-zinc-300 cursor-pointer">Security Model</span>
          <span className="hover:text-zinc-300 cursor-pointer">Signal Tomography</span>
        </div>
      </footer>
    </div>
  );
}
