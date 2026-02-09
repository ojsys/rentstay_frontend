import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationAPI } from '../../services/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const ApplicationDetail = ({ application, onClose, onRefresh }) => {
  const [notes, setNotes] = useState(application?.landlord_notes || '');
  const [responseMsg, setResponseMsg] = useState('');
  const queryClient = useQueryClient();

  const { data: detail } = useQuery({
    queryKey: ['application-detail', application?.id],
    queryFn: () => applicationAPI.getDetail(application.id).then(r => r.data),
    enabled: !!application?.id,
  });

  const approveMutation = useMutation({
    mutationFn: () => applicationAPI.approve(application.id, responseMsg),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['applications'] }); onRefresh?.(); },
  });

  const rejectMutation = useMutation({
    mutationFn: () => applicationAPI.reject(application.id, responseMsg),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['applications'] }); onRefresh?.(); },
  });

  const notesMutation = useMutation({
    mutationFn: () => applicationAPI.updateNotes(application.id, { landlord_notes: notes }),
  });

  const app = detail || application;
  if (!app) return null;

  const tenant = app.tenant || {};

  return (
    <div className="bg-white rounded-lg border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Application Details</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
      </div>

      {/* Tenant Profile */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
          {(tenant.first_name?.[0] || tenant.email?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{tenant.first_name} {tenant.last_name}</p>
          <p className="text-sm text-gray-500">{tenant.email}</p>
          {tenant.phone && <p className="text-sm text-gray-500">{tenant.phone}</p>}
        </div>
        <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-gray-100'}`}>
          {app.status}
        </span>
      </div>

      {/* Property */}
      {app.property && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm text-gray-500 mb-1">Property</p>
          <p className="font-medium">{app.property.title}</p>
          <p className="text-sm text-gray-500">{app.property.area}, {app.property.lga_name}</p>
        </div>
      )}

      {/* Application Message */}
      <div className="mb-4 pb-4 border-b">
        <p className="text-sm text-gray-500 mb-1">Applicant Message</p>
        <p className="text-sm">{app.message || 'No message provided'}</p>
      </div>

      {/* Employment & Income */}
      {(app.employment_type || app.monthly_income) && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm font-medium text-gray-700 mb-2">Employment & Income</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {app.employment_type && (
              <div><span className="text-gray-500">Type:</span> {app.employment_type.replace('_', ' ')}</div>
            )}
            {app.employer_name && (
              <div><span className="text-gray-500">Employer:</span> {app.employer_name}</div>
            )}
            {app.monthly_income && (
              <div><span className="text-gray-500">Income:</span> &#8358;{Number(app.monthly_income).toLocaleString()}</div>
            )}
            {app.offered_rent_term && (
              <div><span className="text-gray-500">Preferred term:</span> {app.offered_rent_term}</div>
            )}
            {app.move_in_date && (
              <div><span className="text-gray-500">Move-in:</span> {app.move_in_date}</div>
            )}
          </div>
        </div>
      )}

      {/* References */}
      {app.references?.length > 0 && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm font-medium text-gray-700 mb-2">References</p>
          <div className="space-y-2">
            {app.references.map((ref, i) => (
              <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                <p className="font-medium">{ref.name}</p>
                <p className="text-gray-500">{ref.phone} {ref.relationship && `(${ref.relationship})`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rental History */}
      {app.rental_history && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm font-medium text-gray-700 mb-1">Rental History</p>
          <p className="text-sm text-gray-600">{app.rental_history}</p>
        </div>
      )}

      {/* Landlord Notes */}
      <div className="mb-4 pb-4 border-b">
        <p className="text-sm font-medium text-gray-700 mb-1">Private Notes</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="Add private notes about this applicant..."
        />
        <button
          onClick={() => notesMutation.mutate()}
          disabled={notesMutation.isPending}
          className="mt-1 text-sm text-emerald-600 hover:text-emerald-700"
        >
          {notesMutation.isPending ? 'Saving...' : 'Save Notes'}
        </button>
      </div>

      {/* Actions */}
      {app.status === 'pending' && (
        <div className="space-y-3">
          <textarea
            value={responseMsg}
            onChange={e => setResponseMsg(e.target.value)}
            rows={2}
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="Response message to tenant (optional)..."
          />
          <div className="flex gap-2">
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const EnhancedApplicationsInbox = () => {
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationAPI.listLandlord().then(r => r.data?.results || r.data || []),
  });

  const filtered = statusFilter === 'all'
    ? applications
    : applications.filter(a => a.status === statusFilter);

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tenant Applications</h2>
        <div className="flex gap-1">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* List */}
        <div className={`space-y-2 ${selectedApp ? 'lg:col-span-2' : 'lg:col-span-5'}`}>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No applications found</div>
          ) : (
            filtered.map(app => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedApp?.id === app.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm truncate">
                    {app.tenant?.first_name} {app.tenant?.last_name}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[app.status] || 'bg-gray-100'}`}>
                    {app.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{app.property?.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(app.created_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        {selectedApp && (
          <div className="lg:col-span-3">
            <ApplicationDetail
              application={selectedApp}
              onClose={() => setSelectedApp(null)}
              onRefresh={refetch}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedApplicationsInbox;
