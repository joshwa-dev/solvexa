import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { dataStore } from '../../services/store/dataStore';
import { signOutUser, changeUserPassword } from '../../services/auth/authService';
import { updateUserProfile } from '../../services/auth/profileService';
import { getUserActivityStats, type ActivityStats } from '../../services/firestore/activityService';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import type { SolvexaUser } from '../../types/user.types';

type SettingsTab = 'account' | 'security' | 'notifications' | 'privacy' | 'activity' | 'management';

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'account';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const { solvexaUser, firebaseUser, isGuest, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Account State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  // Privacy State
  const [isPrivate, setIsPrivate] = useState(false);
  const [whoCanMessage, setWhoCanMessage] = useState<'everyone' | 'following' | 'nobody'>('everyone');
  const [whoCanComment, setWhoCanComment] = useState<'everyone' | 'following' | 'nobody'>('everyone');

  // Notifications State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [signalsNotif, setSignalsNotif] = useState(true);
  const [commentsNotif, setCommentsNotif] = useState(true);
  const [followsNotif, setFollowsNotif] = useState(true);
  const [messagesNotif, setMessagesNotif] = useState(true);

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Activity Stats State
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Sync state when solvexaUser loads
  useEffect(() => {
    if (solvexaUser) {
      setDisplayName(solvexaUser.displayName || '');
      setUsername(solvexaUser.username || '');
      setEmail(solvexaUser.email || firebaseUser?.email || '');
      setBio(solvexaUser.bio || '');
      setIsPrivate(!!solvexaUser.isPrivate);
      setWhoCanMessage(solvexaUser.privacySettings?.whoCanMessage || 'everyone');
      setWhoCanComment(solvexaUser.privacySettings?.whoCanComment || 'everyone');
      setSignalsNotif(solvexaUser.notificationPrefs?.signals ?? true);
      setCommentsNotif(solvexaUser.notificationPrefs?.comments ?? true);
      setFollowsNotif(solvexaUser.notificationPrefs?.follows ?? true);
      setMessagesNotif(solvexaUser.notificationPrefs?.messages ?? true);
    }
  }, [solvexaUser, firebaseUser]);

  // Load activity stats when tab changes to 'activity'
  useEffect(() => {
    if (activeTab === 'activity' && solvexaUser?.uid) {
      setIsLoadingActivity(true);
      getUserActivityStats(solvexaUser.uid).then((stats) => {
        setActivityStats(stats);
        setIsLoadingActivity(false);
      });
    }
  }, [activeTab, solvexaUser]);

  // Sync activeTab with search param
  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTab;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const showSuccess = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage(null);
      const updates: Partial<SolvexaUser> = {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
      };
      dataStore.updateCurrentUser(updates);
      const isRealUser = solvexaUser?.uid && !solvexaUser.uid.startsWith('guest_') && !solvexaUser.uid.startsWith('user_anonymous');
      if (isRealUser) {
        await updateUserProfile(solvexaUser.uid, updates).catch(() => {});
      }
      await refreshProfile();
      showSuccess('Profile information updated successfully.');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to save account changes');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setErrorMessage(null);
      const updates: Partial<SolvexaUser> = {
        isPrivate,
        privacySettings: {
          whoCanMessage,
          whoCanMention: solvexaUser?.privacySettings?.whoCanMention || 'everyone',
          whoCanComment,
          activityVisible: solvexaUser?.privacySettings?.activityVisible ?? true,
        },
      };
      dataStore.updateCurrentUser(updates);
      const isRealUser = solvexaUser?.uid && !solvexaUser.uid.startsWith('guest_') && !solvexaUser.uid.startsWith('user_anonymous');
      if (isRealUser) {
        await updateUserProfile(solvexaUser.uid, updates).catch(() => {});
      }
      await refreshProfile();
      showSuccess('Privacy settings saved.');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to save privacy settings');
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setErrorMessage(null);
      const updates = {
        notificationPrefs: {
          signals: signalsNotif,
          comments: commentsNotif,
          follows: followsNotif,
          mentions: true,
          messages: messagesNotif,
          spaceActivity: true,
          momentReplies: true,
        },
      };
      dataStore.updateCurrentUser(updates);
      const isRealUser = solvexaUser?.uid && !solvexaUser.uid.startsWith('guest_') && !solvexaUser.uid.startsWith('user_anonymous');
      if (isRealUser) {
        await updateUserProfile(solvexaUser.uid, updates).catch(() => {});
      }
      await refreshProfile();
      showSuccess('Notification preferences saved.');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to save notification preferences');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setErrorMessage('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      setErrorMessage(null);
      await changeUserPassword(currentPassword, newPassword);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Password updated successfully.');
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to change password');
      setIsChangingPassword(false);
    }
  };

  const handleDownloadData = () => {
    const data = {
      user: solvexaUser,
      posts: dataStore.getPosts().filter((p) => p.authorId === solvexaUser?.uid),
      signals: dataStore.getSignals().filter((s) => s.authorId === solvexaUser?.uid),
      moments: dataStore.getMoments().filter((m) => m.author.uid === solvexaUser?.uid),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solvexa-data-${solvexaUser?.username || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Your telemetry archive has been downloaded.');
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      setIsDeletingAccount(true);
      if (isGuest) {
        signOut();
      } else {
        await signOutUser();
      }
      navigate('/');
    } catch {
      setIsDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    if (isGuest) {
      signOut();
    } else {
      await signOutUser();
    }
    navigate('/');
  };

  const isGoogleUser = firebaseUser?.providerData?.some((p) => p.providerId === 'google.com');

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 sm:p-6 md:p-10 text-white max-w-5xl mx-auto space-y-8 pb-24 select-none">
      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Settings & Node Control
          </h1>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mt-1">
            Manage your credentials, privacy, telemetry & security
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-xl text-xs font-bold text-error hover:bg-error/10 border border-error/20 transition-all self-start sm:self-auto flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>Log Out</span>
        </button>
      </div>

      {/* Alert Toasts */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{savedSuccess}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2.5 animate-in fade-in">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Split Layout: [ Left Tabs Navigation ] | [ Right Content Panel ] */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Navigation Tabs (4 cols) */}
        <div className="md:col-span-4 space-y-1.5 p-2 rounded-2xl bg-[#141416]/90 border border-white/10">
          {[
            { id: 'account', label: 'Account Profile', icon: 'person' },
            { id: 'security', label: 'Security & Auth', icon: 'security' },
            { id: 'privacy', label: 'Privacy & Access', icon: 'lock' },
            { id: 'notifications', label: 'Notifications', icon: 'notifications' },
            { id: 'activity', label: 'Activity & Time', icon: 'monitoring' },
            { id: 'management', label: 'Account Management', icon: 'manage_accounts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as SettingsTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#7a00ff]/20 to-[#0066ff]/20 border border-primary/40 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${activeTab === tab.id ? 'text-primary' : ''}`}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Content Panel (8 cols) */}
        <div className="md:col-span-8 min-w-0 space-y-6">
          {/* TAB 1: ACCOUNT PROFILE */}
          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount} className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-primary text-xl">person</span>
                <span>Account Profile</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-[#1c1b1c]/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-zinc-400 cursor-not-allowed"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Managed by your authenticated identity provider.</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Bio / Focus
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-lg shadow-purple-900/40"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & AUTHENTICATION */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password / Google Auth notice */}
              <div className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="material-symbols-outlined text-primary text-xl">key</span>
                  <span>Authentication & Password</span>
                </h2>

                {isGoogleUser ? (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <span className="material-symbols-outlined text-primary">g_mobiledata</span>
                      <span>Google Single Sign-On Active</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Your Solvexa node is authenticated securely via Google Sign-In. Password changes and multi-factor authentication are managed directly through your Google Account settings.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400">Manage your email/password credentials securely.</span>
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showPasswords ? 'visibility_off' : 'visibility'}
                        </span>
                        <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Current Password
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none placeholder:text-zinc-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          New Password
                        </label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none placeholder:text-zinc-600"
                        />
                        {newPassword && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                            <span className="text-zinc-500">Strength:</span>
                            <span
                              className={`font-bold ${
                                newPassword.length < 6
                                  ? 'text-rose-400'
                                  : newPassword.length < 10
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {newPassword.length < 6
                                ? 'Too short'
                                : newPassword.length < 10
                                ? 'Fair'
                                : 'Strong'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Confirm New Password
                        </label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full bg-[#1c1b1c] border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none placeholder:text-zinc-600"
                        />
                        {confirmPassword && confirmPassword !== newPassword && (
                          <span className="text-[10px] text-rose-400 mt-1 block">
                            Passwords do not match
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-lg shadow-purple-900/40 disabled:opacity-40 transition-all"
                      >
                        {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Active Sessions & Login Activity */}
              <div className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="material-symbols-outlined text-primary text-xl">devices</span>
                  <span>Active Sessions & Login Activity</span>
                </h2>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-400 text-2xl">laptop_windows</span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Current Session</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                            Active Now
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">Chrome on Windows • Local Mesh Node</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & ACCESS */}
          {activeTab === 'privacy' && (
            <div className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-primary text-xl">lock</span>
                <span>Privacy & Access Control</span>
              </h2>

              <div className="space-y-4">
                {/* Private Node Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <div className="text-xs font-bold text-white">Private Node Account</div>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      Only approved resonators can view your full signals and telemetry.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      isPrivate ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        isPrivate ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Who can message */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                    Who can transmit direct Nexus messages to you
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['everyone', 'following', 'nobody'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setWhoCanMessage(opt)}
                        className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                          whoCanMessage === opt
                            ? 'bg-primary/20 border-primary text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Who can comment */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                    Who can resonate / comment on your signals
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['everyone', 'following', 'nobody'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setWhoCanComment(opt)}
                        className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                          whoCanComment === opt
                            ? 'bg-primary/20 border-primary text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-lg shadow-purple-900/40"
                >
                  Save Privacy Controls
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-primary text-xl">notifications</span>
                <span>Signal Telemetry & Alerts</span>
              </h2>

              <div className="space-y-3">
                {[
                  { label: 'Push Notifications (Desktop & Mobile)', val: pushEnabled, set: setPushEnabled },
                  { label: 'Email Digest Notifications', val: emailEnabled, set: setEmailEnabled },
                  { label: 'Signal Resonances (Likes)', val: signalsNotif, set: setSignalsNotif },
                  { label: 'Comments & Insight Threads', val: commentsNotif, set: setCommentsNotif },
                  { label: 'New Orbit Resonators (Follows)', val: followsNotif, set: setFollowsNotif },
                  { label: 'Direct Nexus Messages', val: messagesNotif, set: setMessagesNotif },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <span className="text-xs font-medium text-zinc-300">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => item.set(!item.val)}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        item.val ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          item.val ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7a00ff] to-[#0066ff] hover:opacity-90 shadow-lg shadow-purple-900/40"
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVITY & TIME */}
          {activeTab === 'activity' && (
            <div className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
                <span>Activity & Time Analysis</span>
              </h2>

              {isLoadingActivity ? (
                <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
                  Synthesizing telemetry records...
                </div>
              ) : !activityStats || !activityStats.hasSufficientData ? (
                <EmptyState variant="activity" />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1 text-center sm:text-left">
                      <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Today's Active Mesh Time</span>
                      <div className="text-xl font-extrabold text-white">{activityStats.todayActiveMinutes} mins</div>
                      <span className="text-[10px] text-emerald-400 font-bold">Computed from live events</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1 text-center sm:text-left">
                      <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Peak Window</span>
                      <div className="text-xl font-extrabold text-primary">
                        {activityStats.peakHourRange || 'Active Orbit'}
                      </div>
                      <span className="text-[10px] text-zinc-400">Optimal interaction rate</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1 text-center sm:text-left">
                      <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Broadcasts & Signals</span>
                      <div className="text-xl font-extrabold text-white">
                        {activityStats.totalPosts + activityStats.totalSignals}
                      </div>
                      <span className="text-[10px] text-zinc-400">Total published broadcasts</span>
                    </div>
                  </div>

                  {/* Weekly Activity Bar Chart */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-white block">Weekly Engagement Histogram</span>
                    <div className="flex items-end justify-between h-32 pt-4 px-2">
                      {activityStats.weeklyEngagement.map((bar, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1">
                          <div
                            className="w-6 sm:w-8 bg-white/10 hover:bg-primary rounded-t-lg transition-all"
                            style={{ height: `${bar.heightPercent}%` }}
                            title={`${bar.count} interactions`}
                          />
                          <span className="text-[10px] text-zinc-400 font-medium">{bar.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 6: ACCOUNT MANAGEMENT */}
          {activeTab === 'management' && (
            <div className="p-6 rounded-3xl bg-[#141416]/90 border border-white/10 space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-primary text-xl">manage_accounts</span>
                <span>Account Management & Data Control</span>
              </h2>

              {/* Download Data */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-white">Download Your Data Archive</div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Export a copy of your posts, signals, moments, and node preferences as JSON.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadData}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Export Archive</span>
                </button>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="p-5 rounded-2xl bg-error/10 border border-error/20 space-y-3">
                <div>
                  <div className="text-xs font-bold text-error">Danger Zone: Delete Account</div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Permanently delete your Solvexa node, profile document, and authentication credentials. This action is irreversible.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-error hover:bg-error/80 transition-all shadow-lg"
                >
                  Delete Solvexa Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Account Deletion">
        <div className="space-y-4 py-2 text-white">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Please type <strong className="text-error font-bold">DELETE</strong> below to permanently delete your Solvexa node account.
          </p>

          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full bg-[#1c1b1c] border border-white/10 focus:border-error rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
              onClick={handleConfirmDeleteAccount}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-error disabled:opacity-30 transition-all"
            >
              {isDeletingAccount ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
