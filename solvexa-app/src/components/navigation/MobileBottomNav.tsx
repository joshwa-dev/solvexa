import { NavLink } from 'react-router-dom';

export function MobileBottomNav() {
  const navItems = [
    { path: '/pulse', label: 'Pulse', icon: 'sensors' },
    { path: '/explore', label: 'Explore', icon: 'explore' },
    { path: '/create', label: 'Broadcast', icon: 'add_circle', isAction: true },
    { path: '/signals', label: 'Signals', icon: 'play_circle' },
    { path: '/messages', label: 'Nexus', icon: 'forum' },
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
              `flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-zinc-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[22px] ${
                    isActive ? 'icon-filled text-primary' : ''
                  }`}
                >
                  {item.icon}
                </span>
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
