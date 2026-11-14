import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Loader2, Search, ShieldCheck, ShieldOff, Ban, RotateCcw, ArrowUpCircle,
  ArrowDownCircle, User as UserIcon, Building2, ArrowLeft, History, Wallet,
  AlertTriangle, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { beginImpersonation } from '../../utils/impersonation';
import useAuthStore from '../../store/authStore';

/**
 * Support desk — find a person, see everything about them, act if you must.
 *
 * Every support conversation starts with "find this account and show me what
 * is going on", and there was no such screen; staff read it out of Django
 * admin across five change-lists.
 *
 * Read-only by default. The handful of actions that change an account sit
 * behind a panel, need a written reason when they remove access, and are
 * recorded against the account.
 *
 * Signing in as a user lives here too, behind its own permission and its own
 * warnings — see utils/impersonation.js for how the two sessions are held, and
 * users/impersonation.py for what such a session is refused.
 */

const naira = (v) => (v === null || v === undefined)
  ? '—'
  : `₦${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Pill = ({ tone = 'gray', children }) => {
  const tones = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
};

const Stat = ({ label, value, hint }) => (
  <div className="card p-3.5">
    <p className="text-[11px] text-dark-500">{label}</p>
    <p className="text-lg font-bold text-dark-900 tabular-nums">{value}</p>
    {hint && <p className="text-[10px] text-dark-400 mt-0.5">{hint}</p>}
  </div>
);

const MiniList = ({ title, rows, empty, render }) => (
  <div className="card p-4">
    <p className="text-sm font-semibold text-dark-900 mb-2">{title}</p>
    {rows?.length ? (
      <ul className="divide-y divide-gray-50">
        {rows.map((r, i) => <li key={r.id ?? i} className="py-2 text-xs">{render(r)}</li>)}
      </ul>
    ) : (
      <p className="text-xs text-dark-400">{empty}</p>
    )}
  </div>
);

const StaffUsers = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const fetchUser = useAuthStore((s) => s.fetchUser);

  // The interceptor sends staff back here when a support session lapses, so
  // they are told why rather than finding themselves mysteriously moved.
  useEffect(() => {
    if (params.get('session') === 'expired') {
      toast('That support session expired. Start another if you still need it.');
      params.delete('session');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const search = async (e) => {
    e?.preventDefault();
    if (query.trim().length < 2) {
      toast.error('Type at least 2 characters');
      return;
    }
    setLoading(true);
    setProfile(null);
    try {
      const { data } = await staffAPI.searchUsers({ q: query.trim() });
      setResults(data.results || []);
      if ((data.results || []).length === 0) toast('Nobody matches that.');
    } catch (e2) {
      toast.error(getErrorMessage(e2, 'Could not search'));
    } finally {
      setLoading(false);
    }
  };

  const open = async (id) => {
    setLoading(true);
    try {
      const { data } = await staffAPI.searchUsers({ user_id: id });
      setProfile(data.profile);
      setReason('');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not open that account'));
    } finally {
      setLoading(false);
    }
  };

  const act = async (action) => {
    setBusy(true);
    try {
      const { data } = await staffAPI.actOnUser({
        user_id: profile.id, action, reason,
      });
      toast.success(data.detail);
      setProfile(data.profile);
      setReason('');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not apply that change'));
    } finally {
      setBusy(false);
    }
  };

  /**
   * Open a support session as this person.
   *
   * The staff session is stashed before the swap, then the store is refreshed
   * so the whole app renders as the target — no page reload, so the stash and
   * the tokens can never end up half-applied across a navigation.
   */
  const signInAs = async () => {
    if (!reason.trim()) {
      toast.error('Give a reason first — it is recorded against this account.');
      return;
    }
    setSigningIn(true);
    try {
      const { data } = await staffAPI.impersonate(profile.id, reason.trim());
      beginImpersonation(data);
      await fetchUser();
      toast.success(data.detail);
      navigate('/');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not start that support session'));
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <UserIcon size={22} /> Support
        </h1>
        <p className="text-sm text-dark-500 mt-1">
          Find an account and see everything about it. Changes are recorded against
          the account with your name.
        </p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input w-full pl-9"
            placeholder="Name, email or phone number"
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary px-5">
          {loading && !profile ? <Loader2 size={15} className="animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Results list */}
      {!profile && results?.length > 0 && (
        <div className="space-y-2">
          {results.map(u => (
            <button
              key={u.id}
              onClick={() => open(u.id)}
              className="card p-4 w-full text-left hover:shadow-md transition flex items-start justify-between gap-3 flex-wrap"
            >
              <div className="min-w-0">
                <p className="font-semibold text-dark-900">{u.name || u.email}</p>
                <p className="text-xs text-dark-500">
                  {u.email}{u.phone && ` · ${u.phone}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Pill tone="sky">{u.user_type_display}</Pill>
                {u.is_verified ? <Pill tone="green">Verified</Pill> : <Pill>Unverified</Pill>}
                {!u.is_active && <Pill tone="red">Suspended</Pill>}
              </div>
            </button>
          ))}
        </div>
      )}

      {!profile && results?.length === 0 && (
        <div className="card p-8 text-center">
          <Search size={28} className="text-dark-200 mx-auto mb-2" />
          <p className="text-dark-600 font-medium">Nobody matches that</p>
          <p className="text-sm text-dark-400 mt-1">Try an email or phone number.</p>
        </div>
      )}

      {/* Profile */}
      {profile && (
        <div className="space-y-4">
          <button
            onClick={() => setProfile(null)}
            className="text-sm text-dark-500 hover:text-dark-800 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back to results
          </button>

          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-dark-900">{profile.name || profile.email}</h2>
                <p className="text-sm text-dark-500">
                  {profile.email}{profile.phone && ` · ${profile.phone}`}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <Pill tone="sky">{profile.user_type_display}</Pill>
                  {profile.is_verified ? <Pill tone="green">Verified</Pill> : <Pill tone="amber">Unverified</Pill>}
                  {!profile.is_active && <Pill tone="red">Suspended</Pill>}
                  {profile.is_staff && <Pill tone="gray">Staff</Pill>}
                  {profile.company && (
                    <Pill tone={profile.company.is_verified ? 'green' : 'amber'}>
                      <Building2 size={9} className="inline mr-0.5" />
                      {profile.company.name}
                    </Pill>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-dark-400">
                <p>Joined {new Date(profile.date_joined).toLocaleDateString()}</p>
                <p>
                  Last seen{' '}
                  {profile.last_login
                    ? new Date(profile.last_login).toLocaleDateString()
                    : 'never'}
                </p>
              </div>
            </div>
          </div>

          {/* Anything waiting on a decision */}
          {(profile.pending?.payouts > 0 || profile.pending?.verifications > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                Waiting on staff:{' '}
                {profile.pending.payouts > 0 && `${profile.pending.payouts} withdrawal(s)`}
                {profile.pending.payouts > 0 && profile.pending.verifications > 0 && ', '}
                {profile.pending.verifications > 0 && `${profile.pending.verifications} verification(s)`}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Paid in total" value={naira(profile.totals.paid)} hint={`${profile.totals.payments} payments`} />
            <Stat label="Bookings" value={profile.totals.bookings} />
            <Stat label="Listings" value={profile.totals.listings} hint={`${profile.pending.unpublished_listings} unpublished`} />
            <Stat label="Agreements" value={profile.totals.agreements} />
          </div>

          <div className="card p-4">
            <p className="text-sm font-semibold text-dark-900 mb-2 flex items-center gap-1.5">
              <Wallet size={14} /> Withdrawable now
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {Object.entries(profile.balances || {}).map(([kind, value]) => (
                <p key={kind} className="text-dark-700">
                  <span className="text-dark-500 capitalize">{kind}:</span>{' '}
                  <strong className="tabular-nums">{naira(value)}</strong>
                </p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <MiniList
              title="Recent bookings"
              rows={profile.recent_bookings}
              empty="No bookings."
              render={(b) => (
                <>
                  <p className="font-medium text-dark-800 truncate">{b.listing}</p>
                  <p className="text-dark-500">
                    #{b.id} · {b.status} · {b.check_in} · {naira(b.amount)}
                  </p>
                </>
              )}
            />
            <MiniList
              title="Recent payments"
              rows={profile.recent_payments}
              empty="No payments."
              render={(p) => (
                <>
                  <p className="font-medium text-dark-800">{p.type} · {naira(p.amount)}</p>
                  <p className="text-dark-500 font-mono">{p.reference} · {p.status}</p>
                </>
              )}
            />
            <MiniList
              title="Recent withdrawals"
              rows={profile.recent_payouts}
              empty="No withdrawals."
              render={(p) => (
                <>
                  <p className="font-medium text-dark-800">{naira(p.amount)} · {p.type}</p>
                  <p className="text-dark-500">{p.status}</p>
                </>
              )}
            />
          </div>

          {/* What staff have already done */}
          <MiniList
            title="Staff history"
            rows={profile.staff_actions}
            empty="Nothing has been changed on this account."
            render={(a) => (
              <>
                <p className="font-medium text-dark-800 flex items-center gap-1.5">
                  <History size={11} className="text-dark-400" /> {a.action} — {a.actor}
                </p>
                <p className="text-dark-500">
                  {new Date(a.created_at).toLocaleString()}
                  {a.reason && ` · ${a.reason}`}
                </p>
              </>
            )}
          />

          {/* Actions */}
          {!profile.is_staff && (
            <div className="card p-5 space-y-3">
              <div>
                <p className="text-sm font-semibold text-dark-900">Change this account</p>
                <p className="text-xs text-dark-500 mt-0.5">
                  Recorded against the account with your name. A reason is required
                  for anything that removes access.
                </p>
              </div>
              <input
                className="input py-2 text-sm w-full"
                placeholder="Reason (required to suspend, unverify or demote)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                {profile.is_verified ? (
                  <button onClick={() => act('unverify')} disabled={busy}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-dark-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5">
                    <ShieldOff size={13} /> Remove verification
                  </button>
                ) : (
                  <button onClick={() => act('verify')} disabled={busy}
                    className="px-3.5 py-2 rounded-xl bg-[#0C3B2E] text-white text-sm font-semibold hover:bg-[#0a3226] transition disabled:opacity-60 flex items-center gap-1.5">
                    <ShieldCheck size={13} /> Mark verified
                  </button>
                )}
                {profile.is_active ? (
                  <button onClick={() => act('suspend')} disabled={busy}
                    className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-60 flex items-center gap-1.5">
                    <Ban size={13} /> Suspend
                  </button>
                ) : (
                  <button onClick={() => act('reactivate')} disabled={busy}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-dark-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5">
                    <RotateCcw size={13} /> Reactivate
                  </button>
                )}
                {profile.user_type === 'agent' && (
                  <button onClick={() => act('promote_super_agent')} disabled={busy}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-dark-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5">
                    <ArrowUpCircle size={13} /> Make super agent
                  </button>
                )}
                {profile.user_type === 'super_agent' && (
                  <button onClick={() => act('demote_super_agent')} disabled={busy}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-dark-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5">
                    <ArrowDownCircle size={13} /> Remove super agent
                  </button>
                )}
                {busy && <Loader2 size={16} className="animate-spin text-dark-400 self-center" />}
              </div>
              <p className="text-[11px] text-dark-400">
                Suspending blocks sign-in. It does not delete anything — agreements,
                bookings and listings are untouched.
              </p>
            </div>
          )}

          {/* Signing in as them. Separate from the account actions above: it
              needs its own permission, and it is the one thing here that lets
              a staff member act *as* someone rather than *on* them. */}
          {!profile.is_staff && (
            <div className="card p-5 space-y-3 border border-amber-200 bg-amber-50/40">
              <div>
                <p className="text-sm font-semibold text-dark-900 flex items-center gap-1.5">
                  <Eye size={14} /> Sign in as this user
                </p>
                <p className="text-xs text-dark-500 mt-0.5">
                  See exactly what they see, for 30 minutes. Uses the reason above,
                  which is recorded against their account with your name.
                </p>
              </div>
              <ul className="text-[11px] text-dark-500 list-disc pl-4 space-y-0.5">
                <li>Their password, email, bank details and payments stay locked.</li>
                <li>Nothing can be deleted while you are in their account.</li>
                <li>The session ends by itself — there is no way to extend it.</li>
              </ul>
              <button
                onClick={signInAs}
                disabled={signingIn || !profile.is_active}
                className="px-3.5 py-2 rounded-xl bg-amber-500 text-amber-950 text-sm font-bold hover:bg-amber-400 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {signingIn ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                Sign in as {profile.name?.split(' ')[0] || 'this user'}
              </button>
              {!profile.is_active && (
                <p className="text-[11px] text-red-600">
                  This account is suspended, so its sessions are rejected.
                  Reactivate it first.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffUsers;
