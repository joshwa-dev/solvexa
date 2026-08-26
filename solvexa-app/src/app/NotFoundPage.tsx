import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#141416] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-primary">sensors_off</span>
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20 mb-3">
          404 - LOST SIGNAL
        </span>
        <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Frequency Not Found</h1>
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          The node or signal you are attempting to tune into does not exist or has been shifted in the network.
        </p>
        <Link
          to="/pulse"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/30"
        >
          <span className="material-symbols-outlined text-lg">sensors</span>
          <span>Return to Pulse Feed</span>
        </Link>
      </div>
    </div>
  );
}
