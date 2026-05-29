import { useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceAPI } from '../../services/api';
import { Loader2, Wrench, CheckCircle, Play, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high:   'bg-amber-100 text-amber-700 border-amber-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_COLORS = {
  pending:     'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
};

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high:   'bg-amber-500',
  medium: 'bg-blue-500',
  low:    'bg-gray-400',
};

const FILTERS = ['', 'pending', 'in_progress', 'completed', 'cancelled'];

const LandlordDashboardMaintenance = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-list'],
    queryFn: () => maintenanceAPI.list().then(res => res.data),
  });

  const allRequests = data?.results || data || [];
  const requests = filter ? allRequests.filter(r => r.status === filter) : allRequests;

  const handleSetStatus = async (id, newStatus) => {
    try {
      await maintenanceAPI.setStatus(id, newStatus);
      toast.success(`Marked as ${newStatus.replace('_', ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['maintenance-list'] });
    } catch {
      toast.error('Failed to update');
    }
  };

  const counts = {
    pending:     allRequests.filter(r => r.status === 'pending').length,
    in_progress: allRequests.filter(r => r.status === 'in_progress').length,
    completed:   allRequests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-900">Maintenance Requests</h2>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock,         label: 'Pending',     value: counts.pending,     color: 'text-amber-500', bg: 'bg-amber-50' },
          { icon: Play,          label: 'In Progress', value: counts.in_progress, color: 'text-blue-500',  bg: 'bg-blue-50' },
          { icon: CheckCircle,   label: 'Completed',   value: counts.completed,   color: 'text-green-500', bg: 'bg-green-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center gap-1">
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
            <p className="text-[10px] text-gray-400 font-medium text-center leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === s ? 'bg-[#0C3B2E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="animate-spin mr-2" /> Loading...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No maintenance requests</p>
          <p className="text-sm text-gray-400 mt-1">Tenant requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Priority bar at top */}
              <div className={`h-1 w-full ${PRIORITY_DOT[r.priority] || 'bg-gray-300'}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 leading-tight">{r.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{r.property?.title || 'Unknown property'}</p>
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                    {r.status?.replace('_', ' ')}
                  </span>
                </div>

                {r.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{r.description}</p>
                )}

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${PRIORITY_COLORS[r.priority] || ''}`}>
                    {r.priority} priority
                  </span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  {r.tenant && (
                    <span className="text-xs text-gray-400">
                      · {r.tenant.full_name || r.tenant.email}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                {(r.status === 'pending' || r.status === 'in_progress') && (
                  <div className="flex gap-2">
                    {r.status === 'pending' && (
                      <button
                        onClick={() => handleSetStatus(r.id, 'in_progress')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition"
                      >
                        <Play size={14} /> Start
                      </button>
                    )}
                    <button
                      onClick={() => handleSetStatus(r.id, 'completed')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"
                    >
                      <CheckCircle size={14} /> Mark Complete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardMaintenance;
