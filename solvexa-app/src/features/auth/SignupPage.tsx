import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpWithEmail, signInWithGoogle } from '../../services/auth/authService';
import { validateEmail, validatePassword, validateUsername } from '../../lib/validators';
import { useAuth } from './AuthContext';

type LoadingState = 'idle' | 'google' | 'email';
interface AuthError {
  message: string;
}

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<AuthError | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signInAsGuest } = useAuth();
  const navigate = useNavigate();

  const isLoading = loading !== 'idle';

  const handleGoogleSignUp = async () => {
    if (isLoading) return;

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
        message: e.message || 'Google sign-up could not be completed. Please check your connection or try again.',
      });
      setLoading('idle');
    }
  };

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!displayName.trim()) {
      setError({ message: 'Full name is required.' });
      return;
    }

    const usernameCheck = validateUsername(username.trim());
    if (!usernameCheck.valid) {
      setError({ message: usernameCheck.error! });
      return;
    }

    const emailCheck = validateEmail(email.trim());
    if (!emailCheck.valid) {
      setError({ message: emailCheck.error! });
      return;
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      setError({ message: passCheck.error! });
      return;
    }

    if (password !== confirmPassword) {
      setError({ message: 'Passwords do not match.' });
      return;
    }

    try {
      setLoading('email');
      setError(null);
      await signUpWithEmail(email.trim(), password, displayName.trim());
      navigate('/pulse');
    } catch (err: unknown) {
      const e = err as Error;
      setError({
        message: e.message || 'Account creation error. Please verify your details and try again.',
      });
      setLoading('idle');
    }
  };

  const handleGuestDemo = () => {
    if (isLoading) return;
    signInAsGuest();
    navigate('/pulse');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0A0A0B] flex flex-col justify-center items-center px-4 py-8 sm:px-6 relative overflow-y-auto overscroll-y-contain">
      {/* Glow Backdrops */}
      <div className="absolute top-1/4 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-purple-600/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-blue-600/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-[#141416]/95 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-2xl relative z-10 mx-auto my-auto transition-all">
        <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
          <Link
            to="/"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center signal-glow shadow-lg shadow-purple-900/40 mb-3 transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7a00ff, #0066ff)' }}
            aria-label="Solvexa Home"
          >
            <span className="material-symbols-outlined text-white text-2xl icon-filled">sensors</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Initialize Signal Node</h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
            Create Your Decentralized Identity
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-error/10 border border-error/25 text-error text-xs flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">error</span>
              <span className="leading-relaxed flex-1">{error.message}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-error/15">
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-[11px] font-bold text-error/80 hover:text-error underline py-0.5"
              >
                Dismiss
              </button>
              <span className="text-zinc-500">•</span>
              <button
                type="button"
                onClick={handleGuestDemo}
                className="text-[11px] font-bold text-primary hover:underline py-0.5"
              >
                Explore Live Demo
              </button>
            </div>
          </div>
        )}

        {/* Google Sign-Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full h-12 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all mb-4 hover:border-white/20 disabled:opacity-50 min-h-[48px] touch-manipulation"
        >
          {loading === 'google' ? (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              <span>Authenticating...</span>
            </span>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="whitespace-nowrap">Sign up with Google</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
            or with email
          </span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        {/* Signup Form */}
        <form onSubmit={handleEmailSignUp} className="space-y-3.5" noValidate>
          <div>
            <label htmlFor="signup-name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Display Name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Elena Vance"
              disabled={isLoading}
              className="w-full h-11 sm:h-12 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 text-base sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="signup-username" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Username Handle
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm select-none">@</span>
              <input
                id="signup-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="elena_vance"
                disabled={isLoading}
                className="w-full h-11 sm:h-12 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl pl-8 pr-4 text-base sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena@solvexa.network"
              disabled={isLoading}
              className="w-full h-11 sm:h-12 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 text-base sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Password <span className="text-[10px] text-zinc-500 font-normal">(min. 8 characters)</span>
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="w-full h-11 sm:h-12 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl pl-4 pr-11 text-base sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="w-full h-11 sm:h-12 bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl pl-4 pr-11 text-base sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-300"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 active:opacity-80 transition-all shadow-lg shadow-purple-900/40 disabled:opacity-50 min-h-[48px] touch-manipulation mt-2 flex items-center justify-center gap-2"
          >
            {loading === 'email' ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Demo Mode Button */}
        <div className="mt-5 pt-5 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={handleGuestDemo}
            disabled={isLoading}
            className="w-full h-11 sm:h-12 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 active:bg-primary/30 border border-primary/30 text-primary font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
          >
            <span className="material-symbols-outlined text-base">sensors</span>
            <span className="whitespace-nowrap">Instant Guest Preview / Demo Mode</span>
          </button>
        </div>

        <div className="mt-5 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold p-1">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
