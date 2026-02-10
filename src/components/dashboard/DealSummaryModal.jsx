import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rentalAPI } from '../../services/api';
import { Loader2 } from 'lucide-react';

const DealSummaryModal = ({ agreementId, onClose, onConfirmed }) => {
  const queryClient = useQueryClient();

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal-summary', agreementId],
    queryFn: () => rentalAPI.getDealSummary(agreementId).then(r => r.data),
    enabled: !!agreementId,
  });

  const confirmMutation = useMutation({
    mutationFn: () => rentalAPI.confirmDeal(agreementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-leases'] });
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      onConfirmed?.();
    },
  });

  if (!agreementId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-dark-900">Deal Summary</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : !deal ? (
          <p className="text-dark-600 text-center py-4">Could not load deal summary.</p>
        ) : (
          <div className="space-y-4">
            {/* Property */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-dark-900">{deal.property_title}</p>
              <p className="text-sm text-dark-600">{deal.property_address}</p>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-dark-500">Landlord</p>
                <p className="font-medium">{deal.landlord_name}</p>
              </div>
              <div>
                <p className="text-dark-500">Tenant</p>
                <p className="font-medium">{deal.tenant_name}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-dark-500">Start Date</p>
                <p className="font-medium">{deal.start_date}</p>
              </div>
              <div>
                <p className="text-dark-500">End Date</p>
                <p className="font-medium">{deal.end_date}</p>
              </div>
            </div>

            {/* Financial breakdown */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-600">Rent Amount</span>
                <span className="font-medium">&#8358;{Number(deal.rent_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-600">Caution Fee</span>
                <span className="font-medium">&#8358;{Number(deal.caution_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-600">Platform Commission</span>
                <span className="font-medium">&#8358;{Number(deal.commission).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2">
                <span>Total Due from Tenant</span>
                <span className="text-primary">&#8358;{Number(deal.total_due).toLocaleString()}</span>
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                deal.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {deal.status}
              </span>
            </div>

            {/* Actions */}
            {deal.status === 'pending' && (
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 font-medium text-sm"
              >
                {confirmMutation.isPending ? 'Confirming...' : 'Confirm Deal'}
              </button>
            )}
            {confirmMutation.isError && (
              <p className="text-red-500 text-sm text-center">
                {confirmMutation.error?.response?.data?.detail || 'Failed to confirm deal'}
              </p>
            )}
            {confirmMutation.isSuccess && (
              <p className="text-green-600 text-sm text-center">Deal confirmed!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealSummaryModal;
