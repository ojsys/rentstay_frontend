import { useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceAPI } from '../../services/api';
import { Loader2, Wrench, CheckCircle, Play, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const priorityColors = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-dark-600',
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-dark-600',
};

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
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['maintenance-list'] });
    } catch {
      toast.error('Failed to update');
    }
  };

  const counts = {
    pending: allRequests.filter(r => r.status === 'pending').length,
    in_progress: allRequests.filter(r => r.status === 'in_progress').length,
    completed: allRequests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dark-900">Maintenance Requests</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <Clock size={20} className="mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{counts.pending}</p>
          <p className="text-xs text-dark-600">Pending</p>
        </div>
        <div className="card text-center">
          <Play size={20} className="mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{counts.in_progress}</p>
          <p className="text-xs text-dark-600">In Progress</p>
        </div>
        <div className="card text-center">
          <CheckCircle size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold text-dark-900">{counts.completed}</p>
          <p className="text-xs text-dark-600">Completed</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'in_progress', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'}`}>
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-dark-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-12">
          <Wrench size={48} className="mx-auto text-dark-300 mb-3" />
          <p className="text-dark-600">No maintenance requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-dark-900">{r.title}</h3>
                  <p className="text-sm text-dark-600 mt-0.5">{r.property?.title || 'Unknown property'}</p>
                  <p className="text-sm text-dark-500 mt-1">{r.description?.substring(0, 120)}{r.description?.length > 120 ? '...' : ''}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${priorityColors[r.priority] || ''}`}>{r.priority}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[r.status] || ''}`}>{r.status?.replace('_', ' ')}</span>
                    <span className="text-xs text-dark-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.tenant && <p className="text-xs text-dark-500 mt-1">Reported by: {r.tenant.full_name || r.tenant.email}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {r.status === 'pending' && (
                    <button onClick={() => handleSetStatus(r.id, 'in_progress')} className="btn btn-secondary btn-sm inline-flex items-center gap-1"><Play size={14} /> Start</button>
                  )}
                  {(r.status === 'pending' || r.status === 'in_progress') && (
                    <button onClick={() => handleSetStatus(r.id, 'completed')} className="btn btn-primary btn-sm inline-flex items-center gap-1"><CheckCircle size={14} /> Complete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandlordDashboardMaintenance;
