import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, sendPasswordReset } from '../../services/auth/authService';
import { validateEmail } from '../../lib/validators';
import { useAuth } from './AuthContext';
import { Modal } from '../../components/common/Modal';

type LoadingState = 'idle' | 'google' | 'email' | 'reset';
interface AuthError {
  message: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<AuthError | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const { signInAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading('google');
      setError(null);
      const res = await signInWithGoogle();
      if (res) {
        navigate('/pulse');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError({
        message: e.message || 'Google sign-in could not be completed. Please check your connection or try again.',
      });
      setLoading('idle');
    }
  };

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError({ message: emailCheck.error! });
      return;
    }
    if (!password) {
      setError({ message: 'Password is required.' });
      return;
    }

    try {
      setLoading('email');
      setError(null);
      await signInWithEmail(email, password);
      navigate('/pulse');
    } catch (err: unknown) {
      const e = err as Error;
      setError({
        message: e.message || 'Authentication error. Please check your credentials.',
      });
      setLoading('idle');
    }
  };

  const handleSendPasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    try {
      setLoading('reset');
      await sendPasswordReset(resetEmail.trim());
      setResetSuccess(true);
      setLoading('idle');
    } catch (err: unknown) {
      const e = err as Error;
      setError({ message: e.message || 'Unable to send password reset email.' });
      setLoading('idle');
    }
  };

  const handleGuestDemo = () => {
    signInAsGuest();
    navigate('/pulse');
  };

  const isLoading = loading !== 'idle';

  return (
    <div className="min-h-screen w-full bg-[#0A0A0B] flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-[440px] bg-[#141416]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative z-10 mx-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            to="/"
            className="w-12 h-12 rounded-2xl flex items-center justify-center signal-glow shadow-lg shadow-purple-900/40 mb-4 transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7a00ff, #0066ff)' }}
          >
            <span className="material-symbols-outlined text-white text-2xl icon-filled">sensors</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Tune into Solvexa</h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
            Signal Flow Authentication
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/25 text-error text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">error</span>
              <span className="leading-relaxed">{error.message}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-error/15">
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-[11px] font-bold text-error/80 hover:text-error underline"
              >
                Try Again
              </button>
              <span className="text-zinc-500">•</span>
              <button
                type="button"
                onClick={handleGuestDemo}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Continue with Demo Mode
              </button>
            </div>
          </div>
        )}

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all mb-4 hover:border-white/20 disabled:opacity-50 min-h-[46px]"
        >
          {loading === 'google' ? (
            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="whitespace-nowrap">Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
            or email
          </span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pioneer@solvexa.network"
              className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetModalOpen(true);
                }}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 transition-all shadow-lg shadow-purple-900/40 disabled:opacity-50 min-h-[46px]"
          >
            {loading === 'email' ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Guest Demo Bypass Button */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={handleGuestDemo}
            className="w-full py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">sensors</span>
            <span className="whitespace-nowrap">Explore as Guest / Instant Live Demo</span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-zinc-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-semibold">
            Create account
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setResetSuccess(false);
        }}
        title="Reset Password"
      >
        <div className="space-y-4 py-2 text-white">
          {resetSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Reset Instructions Transmitted</span>
              </div>
              <p className="leading-relaxed">
                If an account exists for <strong>{resetEmail}</strong>, we have sent a secure password reset link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendPasswordReset} className="space-y-4">
              <p className="text-xs text-zinc-400">
                Enter your account email address. We will send you instructions to reset your password.
              </p>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="pioneer@solvexa.network"
                  className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading === 'reset' || !resetEmail.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary disabled:opacity-50"
                >
                  {loading === 'reset' ? 'Transmitting...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
