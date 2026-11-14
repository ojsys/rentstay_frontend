import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import {
  CHANGED_EVENT, hasExpired, minutesLeft, readImpersonation, restoreStaffSession,
} from '../../utils/impersonation';

/**
 * The strip across the top of every page while staff are signed in as someone
 * else.
 *
 * Loud on purpose. The one thing that must never happen is a staff member
 * forgetting whose account they are in and reading it as their own — so the
 * banner is fixed, high-contrast, names the person, counts the session down,
 * and carries the way out. It is rendered from `Layout`, above everything, so
 * no route can be reached without it.
 */
const ImpersonationBanner = () => {
  const [session, setSession] = useState(() => readImpersonation());
  const [leaving, setLeaving] = useState(false);
  const [, setTick] = useState(0);
  const navigate = useNavigate();
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const leave = useCallback(async (message = 'Back to your own account.') => {
    setLeaving(true);
    try {
      // Best effort: the closing audit row matters, but a network failure must
      // not be able to trap someone inside a support session.
      await staffAPI.stopImpersonating().catch(() => {});
      restoreStaffSession();
      setSession(null);
      await fetchUser();
      toast.success(message);
      navigate('/staff/dashboard/users');
    } finally {
      setLeaving(false);
    }
  }, [fetchUser, navigate]);

  // Re-render once a minute so the countdown is honest, and close the session
  // out the moment it lapses rather than waiting for the next 401.
  useEffect(() => {
    if (!session) return undefined;
    const id = setInterval(() => {
      if (hasExpired(readImpersonation())) {
        leave('That support session expired.');
      } else {
        setTick((t) => t + 1);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [session, leave]);

  // Two sources: our own event for the tab that started the session (the
  // browser does not fire `storage` at the tab that wrote it, so the banner
  // would otherwise not appear until a reload), and `storage` for every other
  // tab, which must not be left showing a session that has ended.
  useEffect(() => {
    const sync = () => setSession(readImpersonation());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!session) return null;

  const left = minutesLeft(session);
  const name = session.target?.name || session.target?.email || 'this user';

  return (
    <div className="sticky top-0 z-[60] bg-amber-400 text-amber-950 shadow-md print:hidden">
      <div className="container-custom flex items-center gap-3 py-2 flex-wrap">
        <Eye size={16} className="flex-shrink-0" />
        <p className="text-sm font-semibold min-w-0">
          Signed in as <span className="underline">{name}</span>
          <span className="hidden sm:inline font-normal">
            {' '}— support session, {left} min left
          </span>
        </p>
        <p className="hidden lg:block text-xs font-normal opacity-80 flex-1 min-w-0">
          Their password, email, bank details and payments are blocked. Everything
          you do here is recorded against your name.
        </p>
        <button
          onClick={() => leave()}
          disabled={leaving}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950 text-amber-50 text-xs font-bold hover:bg-amber-900 transition disabled:opacity-60 flex-shrink-0"
        >
          {leaving ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
          Exit
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
