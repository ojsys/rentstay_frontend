/**
 * Holding two sessions at once: the staff member's, and the user they are
 * signed in as.
 *
 * All of it lives here because the swap touches three separate keys — the
 * access token, the refresh token and the persisted auth store — and getting
 * one of them wrong either strands the staff member as somebody else or leaves
 * a support token in place after they think they have left.
 *
 * The impersonation token is deliberately stored with **no refresh token**: the
 * server issues none, and leaving the staff member's own refresh token in place
 * would let the interceptor quietly mint a fresh *staff* token in the middle of
 * a support session, mixing the two identities.
 */

const SESSION = 'impersonation';
const STASH = {
  access: 'staff_access_token',
  refresh: 'staff_refresh_token',
  store: 'staff_auth_storage',
};

/**
 * Fired whenever a session starts or ends.
 *
 * The browser's own `storage` event only reaches *other* tabs, so the banner in
 * the tab that started the session would not appear until a reload — leaving
 * staff inside someone's account with nothing on screen saying so.
 */
export const CHANGED_EVENT = 'impersonation-changed';

const announce = () => window.dispatchEvent(new Event(CHANGED_EVENT));

/** The open support session, or null. Never throws on malformed storage. */
export const readImpersonation = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION) || 'null');
  } catch {
    return null;
  }
};

export const isImpersonating = () => !!readImpersonation();

/**
 * Swap the staff session out for the impersonation token.
 * @param payload the body returned by POST /staff/impersonate/
 */
export const beginImpersonation = (payload) => {
  localStorage.setItem(STASH.access, localStorage.getItem('access_token') || '');
  localStorage.setItem(STASH.refresh, localStorage.getItem('refresh_token') || '');
  localStorage.setItem(STASH.store, localStorage.getItem('auth-storage') || '');

  localStorage.setItem('access_token', payload.access);
  localStorage.removeItem('refresh_token');
  localStorage.setItem(SESSION, JSON.stringify({
    target: payload.target,
    actor: payload.actor,
    expires_at: payload.expires_at,
  }));
  announce();
};

/**
 * Put the staff member back in their own session.
 *
 * Safe to call twice, and safe to call when the stash is empty — a support
 * session that cannot be exited is the worst possible failure here, so this
 * always ends up with the impersonation keys gone.
 */
export const restoreStaffSession = () => {
  const access = localStorage.getItem(STASH.access);
  const refresh = localStorage.getItem(STASH.refresh);
  const store = localStorage.getItem(STASH.store);

  if (access) localStorage.setItem('access_token', access);
  else localStorage.removeItem('access_token');

  if (refresh) localStorage.setItem('refresh_token', refresh);
  else localStorage.removeItem('refresh_token');

  if (store) localStorage.setItem('auth-storage', store);

  localStorage.removeItem(SESSION);
  Object.values(STASH).forEach((key) => localStorage.removeItem(key));
  announce();
};

/** Whole minutes left in the session, floored at 0. */
export const minutesLeft = (session) => {
  if (!session?.expires_at) return 0;
  const ms = new Date(session.expires_at).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 60000));
};

export const hasExpired = (session) =>
  !!session?.expires_at && new Date(session.expires_at).getTime() <= Date.now();
