import { Link } from 'react-router-dom';
import { Plus, ShieldCheck, UserCheck, CreditCard, Wrench } from 'lucide-react';

const actions = [
  { to: '/properties/new', icon: Plus, label: 'List Property', color: 'bg-primary text-white' },
  { to: '/verify', icon: ShieldCheck, label: 'Verify Property', color: 'bg-amber-500 text-white' },
  { to: '/applications', icon: UserCheck, label: 'Review Tenants', color: 'bg-green-600 text-white' },
  { to: '/dashboard/payments', icon: CreditCard, label: 'Record Payment', color: 'bg-indigo-600 text-white' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance', color: 'bg-rose-600 text-white' },
];

const QuickActionBar = () => (
  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-6">
    {actions.map((action) => (
      <Link
        key={action.to}
        to={action.to}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all hover:opacity-90 ${action.color}`}
      >
        <action.icon size={16} />
        <span className="whitespace-nowrap">{action.label}</span>
      </Link>
    ))}
  </div>
);

export default QuickActionBar;
