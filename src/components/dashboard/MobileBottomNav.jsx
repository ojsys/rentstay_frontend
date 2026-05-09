import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const MobileBottomNav = ({ primaryTabs = [], moreTabs = [], badges = {} }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const isMoreActive = moreTabs.some(
    (t) => location.pathname === t.to || location.pathname.startsWith(t.to + '/')
  );

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryTabs.map((tab) => {
            const isActive =
              location.pathname === tab.to ||
              location.pathname.startsWith(tab.to + '/');
            const badge = badges[tab.badgeKey];
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px]"
              >
                <div className="relative">
                  <tab.icon
                    size={22}
                    className={isActive ? 'text-amber-500' : 'text-gray-400'}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {typeof badge === 'number' && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium leading-tight ${
                    isActive ? 'text-amber-500' : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>
              </NavLink>
            );
          })}

          {moreTabs.length > 0 && (
            <button
              onClick={() => setMoreOpen((prev) => !prev)}
              className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px]"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isMoreActive || moreOpen ? '#F59E0B' : '#9CA3AF'}
                strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="5" cy="12" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
              </svg>
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isMoreActive || moreOpen ? 'text-amber-500' : 'text-gray-400'
                }`}
              >
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* More Drawer Overlay */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl md:hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-800 text-sm">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 pb-6">
              {moreTabs.map((tab) => {
                const isActive =
                  location.pathname === tab.to ||
                  location.pathname.startsWith(tab.to + '/');
                const badge = badges[tab.badgeKey];
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-amber-50 text-amber-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative">
                      <tab.icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
                      {typeof badge === 'number' && badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">
                      {tab.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileBottomNav;
