import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { signOutUser } from '../../services/auth/authService';
import { dataStore } from '../../services/store/dataStore';
import { Avatar, resolveAvatarSrc } from '../common/Avatar';

export function TopBar() {
  const { solvexaUser, firebaseUser, isGuest, dataMode, signOut, exitDemoMode } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const avatarUrl = resolveAvatarSrc(solvexaUser, firebaseUser);
  const displayName = solvexaUser?.displayName || firebaseUser?.displayName || 'Solvexa User';
  const username = solvexaUser?.username || 'user';

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      setDropdownOpen(false);
      if (isGuest) {
        signOut();
      } else {
        await signOutUser();
      }
      navigate('/');
    } catch {
      setSigningOut(false);
    }
  };

  const unreadCount = dataStore.getUnreadNotificationCount();

  return (
    <header
      className="hidden md:flex justify-between items-center h-16 fixed top-0 z-30 px-8 border-b"
      style={{
        left: '256px',
        right: 0,
        backgroundColor: 'rgba(10,10,11,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative w-80">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search signals, tags, pioneers..."
          className="w-full bg-[#141416] border border-white/10 focus:border-primary rounded-full pl-10 pr-4 py-1.5 text-xs text-on-surface placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
      </form>

      {/* Right Actions & Profile Dropdown */}
      <div className="flex items-center gap-4">
        {dataMode === 'DEMO' && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Demo Mode</span>
            <button
              type="button"
              onClick={() => {
                exitDemoMode();
                navigate('/login');
              }}
              className="ml-1 text-[10px] text-zinc-400 hover:text-white underline font-normal"
            >
              Sign In
            </button>
          </div>
        )}

        <Link
          to="/notifications"
          className="relative p-2 text-on-surface-variant hover:text-white transition-colors"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full signal-glow" />
          )}
        </Link>

        <Link
          to="/messages"
          className="relative p-2 text-on-surface-variant hover:text-white transition-colors"
          title="Nexus Messages"
        >
          <span className="material-symbols-outlined text-[20px]">mail</span>
        </Link>

        {/* Profile Avatar with Dropdown */}
        <div className="relative pl-2 border-l border-white/10" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 focus:outline-none hover:opacity-90 transition-opacity"
            aria-label="User profile menu"
          >
            <Avatar
              src={avatarUrl}
              name={displayName}
              size="sm"
              hasStory
              hasStoryUnviewed
            />
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-[#141416] border border-white/15 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 text-white">
              {/* User snippet */}
              <div className="px-4 py-3 border-b border-white/10">
                <div className="text-xs font-bold text-white truncate">{displayName}</div>
                <div className="text-[11px] text-zinc-400 truncate">@{username}</div>
              </div>

              <div className="py-1">
                <Link
                  to="/orbit"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-primary">person</span>
                  <span>My Profile (Orbit)</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">settings</span>
                  <span>Settings & Privacy</span>
                </Link>

                <Link
                  to="/settings?tab=activity"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">monitoring</span>
                  <span>Activity & Time</span>
                </Link>

                <Link
                  to="/saved"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">bookmark</span>
                  <span>Saved Signals</span>
                </Link>
              </div>

              <div className="border-t border-white/10 pt-1">
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>{signingOut ? 'Signing out...' : 'Log Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
