import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { messagingAPI } from '../../services/api';

/**
 * Notification bell with an unread badge and a dropdown of recent activity.
 *
 * Before this, `/notifications` was a plain text link buried in the profile
 * dropdown with no unread count anywhere — so a host had no way to notice that
 * a booking needed their approval without going looking for it.
 *
 * Polls rather than holding a socket open: the backend has no realtime channel,
 * and one small request a minute is cheap next to the complexity of adding one.
 * Polling pauses when the tab is hidden, so a browser left open overnight is not
 * still hitting the API every minute in the morning.
 */

const POLL_MS = 60_000;

/** Where a notification should take you, falling back to the full list. */
const targetFor = (n) => n.link || '/notifications';

const timeAgo = (iso) => {
  if (!iso) return '';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

// Booking events get a colour so the urgent ones stand out in a long list.
const TONE = {
  booking_requested: 'bg-amber-400',
  booking_approved: 'bg-sky-400',
  booking_confirmed: 'bg-emerald-400',
  booking_declined: 'bg-red-400',
  booking_cancelled: 'bg-red-400',
  booking_move_requested: 'bg-sky-400',
  booking_moved: 'bg-emerald-400',
  booking_move_declined: 'bg-red-400',
  payout_update: 'bg-emerald-400',
  new_message: 'bg-primary',
};

const NotificationBell = ({ className = '', tone = 'dark' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-summary'],
    queryFn: () => messagingAPI.getNotificationSummary().then((r) => r.data),
    refetchInterval: POLL_MS,
    // Without this the interval keeps firing in a background tab.
    refetchIntervalInBackground: false,
    staleTime: 30_000,
    // Polling without a token can only 401, which logs the session out from
    // under the user. Render the bell empty instead.
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
  });

  const items = data?.results || [];
  const unread = data?.unread_count || 0;

  // Close on an outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notification-summary'] });

  const openItem = async (n) => {
    setOpen(false);
    if (!n.is_read) {
      try {
        await messagingAPI.markAsRead(n.id);
        refresh();
      } catch {
        // Navigating matters more than the badge; the poll will correct it.
      }
    }
    const target = targetFor(n);
    // Links are stored as app paths, but an absolute URL would break navigate().
    if (/^https?:\/\//i.test(target)) window.location.href = target;
    else navigate(target);
  };

  const markAll = async () => {
    try {
      await messagingAPI.markAllNotificationsRead();
      refresh();
    } catch { /* the next poll will show the true state */ }
  };

  const iconColour = tone === 'light' ? 'text-white' : 'text-dark-600 hover:text-dark-900';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-lg transition ${tone === 'light' ? 'bg-white/10 hover:bg-white/20' : 'hover:bg-gray-100'}`}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell size={20} className={iconColour} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-dark-900">
              Notifications {unread > 0 && <span className="text-dark-400 font-normal">({unread} new)</span>}
            </p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 flex justify-center">
                <Loader2 size={18} className="animate-spin text-dark-300" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={26} className="mx-auto text-dark-200 mb-2" />
                <p className="text-sm text-dark-500">Nothing yet</p>
                <p className="text-xs text-dark-400 mt-1">
                  Booking requests and messages will show up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => openItem(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition flex gap-3 ${n.is_read ? '' : 'bg-sky-50/40'}`}
                    >
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          n.is_read ? 'bg-gray-200' : (TONE[n.notification_type] || 'bg-primary')
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm truncate ${n.is_read ? 'text-dark-700' : 'font-semibold text-dark-900'}`}>
                          {n.title}
                        </span>
                        <span className="block text-xs text-dark-500 line-clamp-2 mt-0.5">
                          {n.message}
                        </span>
                        <span className="block text-[11px] text-dark-400 mt-1">
                          {timeAgo(n.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => { setOpen(false); navigate('/notifications'); }}
            className="w-full px-4 py-3 text-sm font-medium text-primary hover:bg-gray-50 border-t border-gray-100 transition"
          >
            See all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
