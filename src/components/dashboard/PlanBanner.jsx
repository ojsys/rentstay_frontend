import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { plansAPI } from '../../services/api';
import { Crown, ArrowRight, AlertTriangle } from 'lucide-react';

const PLAN_LABELS = {
  starter: 'Starter',
  professional: 'Professional',
  professional_plus: 'Professional Plus',
  enterprise: 'Enterprise',
};

/**
 * Compact plan + property-usage strip for the landlord dashboard.
 * Reads GET /plans/me/ and nudges an upgrade when the property cap is reached.
 */
const PlanBanner = () => {
  const { data } = useQuery({
    queryKey: ['my-plan'],
    queryFn: () => plansAPI.getMine().then((res) => res.data),
  });

  if (!data) return null;

  const {
    effective_plan: plan,
    property_count: count = 0,
    property_limit: limit,
    can_add_property: canAdd,
  } = data;

  const planName = PLAN_LABELS[plan] || plan;
  const unlimited = limit == null;
  const atLimit = !canAdd;
  const usagePct = unlimited ? 0 : Math.min(100, Math.round((count / limit) * 100));

  return (
    <div
      className={`rounded-2xl p-4 md:p-5 shadow-card ring-1 flex flex-col sm:flex-row sm:items-center gap-4 ${
        atLimit ? 'ring-amber-200 bg-amber-50' : 'ring-gray-100 bg-white'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary flex items-center justify-center flex-shrink-0">
          <Crown size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dark-900">
            {planName} plan
          </p>
          <p className="text-xs text-dark-600">
            {unlimited
              ? `${count} propert${count === 1 ? 'y' : 'ies'} · unlimited`
              : `${count} of ${limit} propert${limit === 1 ? 'y' : 'ies'} used`}
          </p>
          {!unlimited && (
            <div className="mt-1.5 h-1.5 w-40 max-w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${atLimit ? 'bg-amber-500' : 'bg-primary'}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {atLimit && (
          <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-amber-700">
            <AlertTriangle size={14} /> Property limit reached
          </span>
        )}
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-600 transition-colors whitespace-nowrap"
        >
          {atLimit ? 'Upgrade plan' : 'Manage plan'} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default PlanBanner;
