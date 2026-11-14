import { useEffect, useState } from 'react';
import {
  Loader2, Activity, AlertTriangle, CheckCircle2, XCircle, Clock,
  Terminal, Copy, RotateCcw, Bug,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';

/**
 * Platform health: are the scheduled jobs running, and what is erroring?
 *
 * The jobs half is the point. Calendar sync, verification reminders and
 * payment reconciliation are cron entries added by hand at deploy time, and a
 * missing entry produces no error anywhere — the feature just stops. This is
 * the only place in the product that would tell you.
 *
 * Each unhealthy job shows the exact crontab line to add, because the fix is
 * almost always "nobody added it" and making someone go and look it up is how
 * it stays unfixed.
 */

const JOB_STATE = {
  ok: { tone: 'bg-emerald-50 border-emerald-200', chip: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Running' },
  overdue: { tone: 'bg-amber-50 border-amber-200', chip: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Overdue' },
  stuck: { tone: 'bg-amber-50 border-amber-200', chip: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Stuck' },
  failing: { tone: 'bg-red-50 border-red-200', chip: 'bg-red-100 text-red-700', icon: XCircle, label: 'Failing' },
  never_run: { tone: 'bg-red-50 border-red-200', chip: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Never run' },
};

const JobCard = ({ job }) => {
  const state = JOB_STATE[job.state] || JOB_STATE.ok;
  const Icon = state.icon;
  const needsSetup = job.state === 'never_run';

  const copyCron = () => {
    const line = `${job.suggested_cron} cd /path/to/backend && ${job.command}`;
    navigator.clipboard?.writeText(line)
      .then(() => toast.success('Crontab line copied'))
      .catch(() => toast.error('Could not copy — select it manually'));
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-2.5 ${state.tone}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-dark-900 flex items-center gap-1.5">
            <Icon size={14} /> {job.label}
          </p>
          <p className="text-xs text-dark-600 mt-0.5">{job.description}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${state.chip}`}>
          {state.label}
        </span>
      </div>

      <p className="text-xs text-dark-800 font-medium">{job.detail}</p>

      {job.state !== 'ok' && (
        <p className="text-xs text-dark-600 italic">{job.matters_because}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-dark-500">
        <span>Expected every {job.expected_every}</span>
        {job.last_run_at && (
          <span>Last run {new Date(job.last_run_at).toLocaleString()}</span>
        )}
        {job.duration_seconds !== null && job.duration_seconds !== undefined && (
          <span>took {job.duration_seconds}s</span>
        )}
      </div>

      {job.last_summary && (
        <p className="text-[11px] text-dark-600 bg-white/60 rounded-lg p-2 font-mono">
          {job.last_summary}
        </p>
      )}

      {needsSetup && (
        <div className="bg-white rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-semibold text-dark-700 flex items-center gap-1.5">
            <Terminal size={11} /> Add this to crontab
          </p>
          <div className="overflow-x-auto">
            <code className="text-[11px] text-dark-800 whitespace-nowrap block">
              {job.suggested_cron} cd /path/to/backend &amp;&amp; {job.command}
            </code>
          </div>
          <button
            onClick={copyCron}
            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <Copy size={10} /> Copy line
          </button>
        </div>
      )}
    </div>
  );
};

const StaffHealth = () => {
  const [jobs, setJobs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [summary, setSummary] = useState({});
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await staffAPI.health(showResolved ? { resolved: 1 } : {});
      setJobs(data.jobs || []);
      setErrors(data.errors || []);
      setSummary(data.summary || {});
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not load platform health'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [showResolved]);

  const act = async (error, action) => {
    setBusy(error.id);
    try {
      const { data } = await staffAPI.actOnError({
        error_id: error.id, action, notes: notes[error.id] || '',
      });
      toast.success(data.detail);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not update that error'));
    } finally {
      setBusy(null);
    }
  };

  const unhealthy = summary.jobs_unhealthy || 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark-900 flex items-center gap-2">
          <Activity size={22} /> Platform health
        </h1>
        <p className="text-sm text-dark-500 mt-1">
          Whether the scheduled jobs are actually running, and what the server is
          erroring on.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-dark-500">Jobs needing attention</p>
          <p className={`text-2xl font-bold ${unhealthy > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {unhealthy}<span className="text-base font-medium text-dark-400">/{summary.jobs_total ?? 0}</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">Open errors</p>
          <p className="text-2xl font-bold text-dark-900">{summary.errors_open ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-dark-500">Seen in last 24h</p>
          <p className={`text-2xl font-bold ${(summary.errors_today || 0) > 0 ? 'text-amber-600' : 'text-dark-900'}`}>
            {summary.errors_today ?? '—'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-dark-400 text-sm p-4">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-dark-900">Scheduled jobs</h2>
            {jobs.length === 0 ? (
              <p className="text-sm text-dark-400">No jobs registered.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {jobs.map(job => <JobCard key={job.name} job={job} />)}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-dark-900 flex items-center gap-2">
                <Bug size={17} /> {showResolved ? 'Resolved errors' : 'Open errors'}
              </h2>
              <button
                onClick={() => setShowResolved(v => !v)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {showResolved ? 'Show open' : 'Show resolved'}
              </button>
            </div>

            {errors.length === 0 ? (
              <div className="card p-8 text-center">
                <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-dark-600 font-medium">
                  {showResolved ? 'Nothing resolved yet' : 'No open errors'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {errors.map(err => (
                  <div key={err.id} className="card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-dark-900 text-sm">
                          {err.exception_type}
                          {err.occurrences > 1 && (
                            <span className="ml-2 text-[11px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">
                              ×{err.occurrences}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-dark-600 mt-0.5 break-words">{err.message}</p>
                        <p className="text-[11px] text-dark-400 mt-1 font-mono">
                          {err.method} {err.path} → {err.status_code}
                          {err.user_email && ` · ${err.user_email}`}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-dark-400">{err.reference}</span>
                    </div>

                    <p className="text-[11px] text-dark-400">
                      First {new Date(err.first_seen).toLocaleString()} · last{' '}
                      {new Date(err.last_seen).toLocaleString()}
                    </p>

                    {err.notes && (
                      <p className="text-xs text-dark-600 bg-gray-50 rounded-lg p-2">{err.notes}</p>
                    )}

                    {err.is_resolved ? (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-xs text-emerald-700">
                          Resolved{err.resolved_by && ` by ${err.resolved_by}`}
                        </p>
                        <button
                          onClick={() => act(err, 'reopen')}
                          disabled={busy === err.id}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-dark-700 text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-1.5"
                        >
                          <RotateCcw size={11} /> Reopen
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <input
                          className="input py-1.5 text-xs flex-1 min-w-[180px]"
                          placeholder="Note (optional) — e.g. fixed in release 12"
                          value={notes[err.id] || ''}
                          onChange={(e) => setNotes(n => ({ ...n, [err.id]: e.target.value }))}
                        />
                        <button
                          onClick={() => act(err, 'resolve')}
                          disabled={busy === err.id}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0C3B2E] text-white text-xs font-semibold hover:bg-[#0a3226] transition disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {busy === err.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : <CheckCircle2 size={11} />}
                          Mark resolved
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default StaffHealth;
