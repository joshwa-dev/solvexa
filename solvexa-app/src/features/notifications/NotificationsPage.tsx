import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';
import type { Notification } from '../../types/notification.types';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'signal' | 'comment' | 'follow' | 'space'>('all');

  useEffect(() => {
    const sync = () => {
      setNotifications(dataStore.getNotifications());
    };
    sync();
    return dataStore.subscribe(sync);
  }, []);

  const handleMarkAllRead = () => {
    dataStore.markAllNotificationsAsRead();
    setNotifications([...dataStore.getNotifications()]);
  };

  const handleItemClick = (notif: Notification) => {
    dataStore.markNotificationAsRead(notif.notificationId);
    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getIconForType = (type: Notification['type']) => {
    switch (type) {
      case 'signal':
        return { icon: 'sensors', color: 'text-primary' };
      case 'comment':
        return { icon: 'chat', color: 'text-cyan-400' };
      case 'follow':
        return { icon: 'person_add', color: 'text-secondary' };
      case 'space':
        return { icon: 'hub', color: 'text-purple-400' };
      default:
        return { icon: 'notifications', color: 'text-white' };
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 md:p-10 text-white max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center signal-glow">
            <span className="material-symbols-outlined text-white text-2xl">notifications</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Signal Notifications</h1>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              Real-Time Mesh Activity & Resonances
            </p>
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">done_all</span>
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'signal', label: 'Signals' },
          { id: 'comment', label: 'Comments' },
          { id: 'follow', label: 'Follows' },
          { id: 'space', label: 'Spaces' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab.id
                ? 'bg-primary/20 text-primary border border-primary/30 shadow-md'
                : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <EmptyState
            variant="notifications"
            title={filter === 'all' ? "You're all caught up" : `No ${filter} notifications`}
            description={
              filter === 'all'
                ? 'New mentions, reactions, follows, and resonances will appear here.'
                : `There are no ${filter} notifications at the moment.`
            }
          />
        ) : (
          filteredNotifs.map((notif) => {
            const { icon, color } = getIconForType(notif.type);

            return (
              <div
                key={notif.notificationId}
                onClick={() => handleItemClick(notif)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  !notif.isRead
                    ? 'bg-gradient-to-r from-purple-950/20 to-blue-950/20 border-primary/40 shadow-lg'
                    : 'bg-[#141416]/80 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={notif.senderPhotoURL}
                      name={notif.senderDisplayName}
                      size="md"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black/90 border border-white/10 flex items-center justify-center ${color}`}
                    >
                      <span className="material-symbols-outlined text-[12px]">{icon}</span>
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-zinc-200">
                      <strong className="text-white font-bold">{notif.senderDisplayName}</strong>{' '}
                      <span className="text-zinc-400">{notif.contentPreview}</span>
                    </p>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 signal-glow animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
