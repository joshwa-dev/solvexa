import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { dataStore } from '../../services/store/dataStore';

export function MobileBottomNav() {
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const update = () => {
      setUnreadMessages(dataStore.getUnreadMessageCount());
    };
    update();
    return dataStore.subscribe(update);
  }, []);

  const navItems = [
    { path: '/pulse', label: 'Pulse', icon: 'sensors' },
    { path: '/explore', label: 'Explore', icon: 'explore' },
    { path: '/create', label: 'Broadcast', icon: 'add_circle', isAction: true },
    { path: '/signals', label: 'Signals', icon: 'play_circle' },
    { path: '/messages', label: 'Nexus', icon: 'forum', badge: unreadMessages > 0 ? unreadMessages : null },
    { path: '/orbit', label: 'Orbit', icon: 'person' },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around px-2 border-t"
      style={{
        backgroundColor: 'rgba(19,19,20,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center -mt-5 group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg signal-glow transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #7a00ff, #0066ff)' }}
              >
                <span className="material-symbols-outlined text-[24px]">add</span>
              </div>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-1 rounded-lg transition-colors relative ${
                isActive ? 'text-primary' : 'text-zinc-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      isActive ? 'icon-filled text-primary' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-secondary text-black leading-tight shadow-md">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-0.5">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
