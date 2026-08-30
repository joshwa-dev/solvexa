import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { dataStore } from '../../services/store/dataStore';
import { Avatar, resolveAvatarSrc } from '../common/Avatar';

interface NavItem {
  path: string;
  name: string;
  icon: string;
  badgeCount?: number;
}

export function SideNav() {
  const { solvexaUser, firebaseUser, dataMode, signOut } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const update = () => {
      setUnreadMessages(dataStore.getUnreadMessageCount());
      setUnreadNotifs(dataStore.getUnreadNotificationCount());
    };
    update();
    return dataStore.subscribe(update);
  }, []);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      navigate('/');
    } catch {
      setSigningOut(false);
    }
  };

  const navItems: NavItem[] = [
    { path: '/pulse', name: 'Pulse', icon: 'sensors' },
    { path: '/explore', name: 'Explore', icon: 'explore' },
    { path: '/signals', name: 'Signals', icon: 'play_circle' },
    { path: '/spaces', name: 'Spaces', icon: 'hub' },
    { path: '/orbit', name: 'My Orbit', icon: 'all_inclusive' },
    { path: '/signal-map', name: 'Signal Map', icon: 'insights' },
    {
      path: '/messages',
      name: 'Nexus',
      icon: 'mail',
      badgeCount: unreadMessages > 0 ? unreadMessages : undefined,
    },
    { path: '/notifications', name: 'Notifications', icon: 'notifications', badgeCount: unreadNotifs > 0 ? unreadNotifs : undefined },
    { path: '/saved', name: 'Saved', icon: 'bookmark' },
  ];

  const avatarUrl = resolveAvatarSrc(solvexaUser, firebaseUser);
  const displayName = solvexaUser?.displayName || firebaseUser?.displayName || 'Solvexa User';
  const username = solvexaUser?.username || 'user';

  return (
    <nav
      className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 py-6 px-4 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(19,19,20,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Brand Header */}
      <div className="mb-6 px-2 flex flex-col gap-2">
        <NavLink to="/pulse" className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center signal-glow shadow-lg transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7a00ff, #0066ff)' }}
          >
            <span className="material-symbols-outlined text-white text-2xl icon-filled">
              sensors
            </span>
          </div>
          <span
            className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #a078ff, #4cd7f6)' }}
          >
            Solvexa
          </span>
        </NavLink>

        {/* User Profile snippet */}
        <NavLink
          to="/orbit"
          className="mt-3 flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group"
        >
          <Avatar src={avatarUrl} name={displayName} size="sm" />
          <div className="flex flex-col min-w-0">
            <span className="text-on-surface font-semibold text-xs truncate group-hover:text-primary transition-colors">{displayName}</span>
            <span className="text-on-surface-variant text-[11px] truncate">@{username}</span>
          </div>
        </NavLink>

        {dataMode === 'DEMO' && (
          <div className="mt-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-[10px] font-bold text-primary">
            <span>Demo Mode</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-xs font-semibold ${
                isActive
                  ? 'text-primary font-bold bg-primary/10 border-l-4 border-primary shadow-[0_0_15px_rgba(208,188,255,0.15)]'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[20px] transition-colors ${
                    isActive ? 'icon-filled text-primary' : 'group-hover:text-primary'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.name}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#7a00ff] to-[#0066ff] text-white">
                    {item.badgeCount}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Create / Broadcast Action */}
      <div className="my-4 px-1">
        <NavLink
          to="/create"
          className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/40"
          style={{ background: 'linear-gradient(135deg, #7a00ff 0%, #0066ff 100%)' }}
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Broadcast Signal</span>
        </NavLink>
      </div>

      {/* Footer / Settings & Logout */}
      <div className="mt-auto border-t border-white/5 pt-4 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive ? 'text-primary bg-white/5' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span>Settings</span>
        </NavLink>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-error hover:bg-error/10 transition-all text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>{signingOut ? 'Disconnecting...' : 'Disconnect'}</span>
        </button>
      </div>
    </nav>
  );
}
