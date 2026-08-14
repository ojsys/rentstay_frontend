import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bed, CalendarDays, Loader2, MapPin, CreditCard, ShieldAlert, ShieldCheck,
  Search, ChevronRight, Users,
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
};

const Stat = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-start gap-3">
    <div className={`p-2.5 rounded-xl bg-gray-100 ${color}`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-dark-500">{label}</p>
      <p className="text-xl font-bold text-dark-900 leading-tight">{value}</p>
    </div>
  </div>
);

const BookingRow = ({ b }) => (
  <Link
    to={`/stays/bookings/${b.id}`}
    className="card p-4 flex items-start gap-3 hover:border-primary transition"
  >
    {b.primary_image ? (
      <img src={b.primary_image} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
    ) : (
      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Bed size={20} className="text-primary" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold text-dark-900 text-sm truncate">{b.listing_title}</p>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[b.status] || ''}`}>
          {b.status_display}
        </span>
      </div>
      <p className="text-xs text-dark-500 mt-0.5 flex items-center gap-1">
        <MapPin size={11} /> Hosted by {b.host_name}
      </p>
      <p className="text-xs text-dark-400 mt-1 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1">
          <CalendarDays size={11} /> {b.check_in} → {b.check_out}
        </span>
        <span className="flex items-center gap-1"><Users size={11} /> {b.guests}</span>
        <span>₦{Number(b.amount_total).toLocaleString()}</span>
      </p>
      {b.days_until_check_in >= 0 && b.status !== 'completed' && (
        <p className="text-xs font-semibold text-primary mt-1">
          {b.days_until_check_in === 0
            ? 'Checking in today'
            : `In ${b.days_until_check_in} day${b.days_until_check_in !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
    <ChevronRight size={16} className="text-dark-300 flex-shrink-0 mt-1" />
  </Link>
);

/**
 * Home screen for guest accounts.
 *
 * Guests have no tenancy, so this answers only "where am I staying and what do
 * I still owe" — rather than the tenant dashboard's rent, agreements and
 * caution fee, none of which apply to them.
 */
const GuestDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['guest-dashboard'],
    queryFn: () => dashboardAPI.getGuestDashboard().then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-dark-400 p-8">
        <Loader2 className="animate-spin" size={18} /> Loading your stays…
      </div>
    );
  }

  const d = data || {};
  const stats = d.stats || {};
  const actions = d.actions || {};
  const upcoming = d.upcoming || [];
  const past = d.past || [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">My Stays</h1>
          <p className="text-sm text-dark-500 mt-1">Your short-stay bookings.</p>
        </div>
        <Link to="/stays" className="btn btn-primary btn-sm flex items-center gap-1.5">
          <Search size={14} /> Find a stay
        </Link>
      </div>

      {/* Outstanding actions */}
      {actions.awaiting_payment > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
          <CreditCard size={18} className="text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sky-900">
              {actions.awaiting_payment} booking{actions.awaiting_payment !== 1 ? 's' : ''} awaiting payment
            </p>
            <p className="text-xs text-sky-800 mt-0.5">
              Your host approved — pay to confirm your stay.
            </p>
          </div>
        </div>
      )}

      {actions.awaiting_verification > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Verify your identity</p>
            <p className="text-xs text-amber-800 mt-0.5">
              {actions.awaiting_verification} upcoming stay
              {actions.awaiting_verification !== 1 ? 's need' : ' needs'} it. Your booking is not
              at risk — it takes about a minute.
            </p>
            <Link
              to="/verify"
              className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 rounded-xl bg-[#0C3B2E] text-white text-xs font-semibold hover:bg-[#0a3226] transition"
            >
              <ShieldCheck size={13} /> Verify now
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={CalendarDays} label="Upcoming" value={stats.upcoming_count ?? 0} color="text-sky-600" />
        <Stat icon={Bed} label="Completed" value={stats.completed_count ?? 0} color="text-emerald-600" />
        <Stat
          icon={CreditCard}
          label="Total spent"
          value={`₦${Number(stats.total_spent || 0).toLocaleString()}`}
          color="text-primary"
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-dark-700 mb-2">Upcoming stays</h2>
        {upcoming.length === 0 ? (
          <div className="card p-8 text-center">
            <Bed size={30} className="text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">No upcoming stays</p>
            <p className="text-sm text-dark-400 mt-1">Find somewhere to stay and book in a few taps.</p>
            <Link to="/stays" className="btn btn-primary btn-sm mt-4 inline-block">Browse stays</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(b => <BookingRow key={b.id} b={b} />)}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-dark-700">Past stays</h2>
            <Link to="/stays/bookings" className="text-xs font-semibold text-primary hover:underline">
              See all
            </Link>
          </div>
          <div className="space-y-2">
            {past.map(b => <BookingRow key={b.id} b={b} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestDashboard;
