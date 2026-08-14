import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert, FileText, Check, Clock, Loader2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardShell from '../components/dashboard/DashboardShell';
import { noticeAPI } from '../services/api';
import { getErrorMessage } from '../utils/errors';

const STATUS_STYLES = {
  served: 'bg-amber-100 text-amber-700',
  acknowledged: 'bg-emerald-100 text-emerald-700',
  withdrawn: 'bg-gray-100 text-gray-400',
};

/**
 * Tenant view of legal notices served on them. Drafts are filtered out
 * server-side, so everything listed here has actually been served.
 */
const Notices = () => {
  const [searchParams] = useSearchParams();
  const highlightId = Number(searchParams.get('notice')) || null;
  const [acking, setAcking] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-notices'],
    queryFn: () => noticeAPI.list().then(r => r.data),
  });

  const notices = useMemo(() => {
    const raw = data?.results || data || [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const acknowledge = async (id) => {
    setAcking(id);
    try {
      await noticeAPI.acknowledge(id);
      toast.success('Receipt acknowledged');
      refetch();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not acknowledge'));
    } finally {
      setAcking(null);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Legal Notices</h1>
          <p className="text-sm text-dark-500 mt-1">
            Formal notices served on you by your landlord.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-dark-400 text-sm p-4">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : notices.length === 0 ? (
          <div className="card p-8 text-center">
            <ShieldAlert size={32} className="text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">No notices</p>
            <p className="text-sm text-dark-400 mt-1">
              Your landlord has not served any legal notices on you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map(n => {
              const expired = n.days_remaining < 0;
              const urgent = !expired && n.days_remaining <= 14;
              return (
                <div
                  key={n.id}
                  className={`card p-5 ${highlightId === n.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert size={18} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-dark-900">{n.notice_type_display}</h2>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[n.status] || ''}`}>
                          {n.status_display}
                        </span>
                      </div>
                      <p className="text-sm text-dark-500 mt-0.5">
                        {n.property_title} · from {n.landlord_name}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-dark-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Issued {n.issued_date}
                        </span>
                        <span>Respond by {n.expiry_date}</span>
                      </div>

                      {n.status !== 'withdrawn' && (
                        <p className={`text-xs font-semibold mt-2 ${expired ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-dark-500'}`}>
                          {expired
                            ? `Expired ${Math.abs(n.days_remaining)} day${Math.abs(n.days_remaining) !== 1 ? 's' : ''} ago`
                            : `${n.days_remaining} day${n.days_remaining !== 1 ? 's' : ''} remaining`}
                        </p>
                      )}

                      {n.document_url && (
                        <a
                          href={n.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mt-3"
                        >
                          <FileText size={14} /> View attached document
                        </a>
                      )}

                      {n.body && (
                        <details className="mt-3 group">
                          <summary className="text-sm font-medium text-dark-700 cursor-pointer hover:text-dark-900">
                            Read the full notice
                          </summary>
                          <div
                            className="prose prose-sm max-w-none mt-3 border border-gray-100 rounded-xl p-4 bg-gray-50/60"
                            dangerouslySetInnerHTML={{ __html: n.body }}
                          />
                        </details>
                      )}

                      {n.status === 'served' && (
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => acknowledge(n.id)}
                            disabled={acking === n.id}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {acking === n.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Check size={14} />}
                            Acknowledge receipt
                          </button>
                          <span className="text-[11px] text-dark-400">
                            Confirms you received it — not that you agree with it.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                If a notice affects your right to remain in the property, consider seeking
                independent legal advice promptly. RentStay records and delivers notices but
                does not provide legal advice.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default Notices;
