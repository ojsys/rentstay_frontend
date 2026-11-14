import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Bed, Clock, CheckCircle, ShieldCheck, ChevronRight, Banknote, Receipt, Activity } from 'lucide-react';
import { staffAPI } from '../../services/api';

const Stat = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-start gap-4">
    <div className={`p-3 rounded-xl bg-gray-100 ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-sm text-dark-500">{label}</p>
      <p className="text-2xl font-bold text-dark-900">{value}</p>
    </div>
  </div>
);

const QueueCard = ({ to, icon: Icon, title, awaiting, live }) => (
  <Link to={to} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className="p-3 rounded-xl bg-primary/10 text-primary">
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <p className="font-semibold text-dark-900">{title}</p>
      <p className="text-sm text-dark-500">
        <span className={awaiting > 0 ? 'text-amber-600 font-medium' : ''}>{awaiting} awaiting review</span>
        {' · '}{live} live
      </p>
    </div>
    <ChevronRight size={20} className="text-dark-400" />
  </Link>
);

const StaffDashboardHome = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['staff-overview'],
    queryFn: () => staffAPI.overview().then((r) => r.data),
  });

  if (isLoading) return <div className="text-center py-12 text-dark-500">Loading…</div>;

  const d = data || {};
  const totalAwaiting = (d.rentals_awaiting || 0) + (d.stays_awaiting || 0);

  return (
    <div className="space-y-6">
      {/* A cron entry that was never added produces no error anywhere, so an
          unhealthy job is called out at the top rather than buried in a tab. */}
      {d.jobs_unhealthy > 0 && (
        <Link
          to="/staff/dashboard/health"
          className="block bg-red-50 border border-red-200 rounded-2xl p-4 hover:bg-red-100/60 transition"
        >
          <p className="text-sm font-semibold text-red-900 flex items-center gap-2">
            <Activity size={16} />
            {d.jobs_unhealthy} scheduled job{d.jobs_unhealthy !== 1 ? 's are' : ' is'} not running as expected
          </p>
          <p className="text-xs text-red-800 mt-0.5">
            Calendar sync, reminders and payment reconciliation fail silently. Open
            Health to see which, and the crontab line to fix it.
          </p>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Banknote} label="Withdrawals waiting" value={d.payouts_awaiting ?? 0} color="text-red-600" />
        <Stat icon={Clock} label="Awaiting review" value={totalAwaiting} color="text-amber-600" />
        <Stat icon={CheckCircle} label="Live rentals" value={d.rentals_live ?? 0} color="text-green-600" />
        <Stat icon={Bed} label="Live stays" value={d.stays_live ?? 0} color="text-blue-600" />
        <Stat icon={ShieldCheck} label="Total listings" value={(d.rentals_total || 0) + (d.stays_total || 0)} color="text-primary" />
      </div>

      <div>
        <h2 className="font-semibold text-dark-900 mb-3">Review queue</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QueueCard
            to="/staff/dashboard/payouts"
            icon={Banknote}
            title="Withdrawals"
            awaiting={d.payouts_awaiting ?? 0}
            live={0}
          />
          <QueueCard
            to="/staff/dashboard/payments"
            icon={Receipt}
            title="Payments to check"
            awaiting={d.payments_needing_check ?? 0}
            live={0}
          />
          <QueueCard
            to="/staff/dashboard/verifications"
            icon={ShieldCheck}
            title="Verification"
            awaiting={d.verifications_awaiting ?? 0}
            live={0}
          />
          <QueueCard
            to="/staff/dashboard/rentals"
            icon={Building2}
            title="Rental properties"
            awaiting={d.rentals_awaiting ?? 0}
            live={d.rentals_live ?? 0}
          />
          <QueueCard
            to="/staff/dashboard/stays"
            icon={Bed}
            title="Short-stay listings"
            awaiting={d.stays_awaiting ?? 0}
            live={d.stays_live ?? 0}
          />
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardHome;
