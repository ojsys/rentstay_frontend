import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moveOutAPI } from '../../services/api';
import InspectionChecklistForm from './InspectionChecklistForm';
import CautionDeductionsManager from './CautionDeductionsManager';

const STATUS_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'inspection_scheduled', label: 'Inspection Scheduled' },
  { key: 'inspected', label: 'Inspected' },
  { key: 'deductions_applied', label: 'Deductions Applied' },
  { key: 'refund_processed', label: 'Refund Processed' },
  { key: 'completed', label: 'Completed' },
];

const StepIndicator = ({ currentStatus }) => {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === currentStatus);
  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
      {STATUS_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            i <= currentIdx ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              i < currentIdx ? 'bg-emerald-600 text-white' : i === currentIdx ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-white'
            }`}>
              {i < currentIdx ? '\u2713' : i + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`w-4 h-0.5 ${i < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

const MoveOutCard = ({ moveOut, onSelect, isSelected }) => {
  return (
    <button
      onClick={() => onSelect(moveOut)}
      className={`w-full text-left p-4 rounded-lg border transition-colors ${
        isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm">{moveOut.tenant_name}</p>
        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
          {moveOut.status?.replace(/_/g, ' ')}
        </span>
      </div>
      <p className="text-xs text-gray-500">{moveOut.property_title}</p>
      <p className="text-xs text-gray-400 mt-1">
        Exit: {moveOut.intended_exit_date}
      </p>
    </button>
  );
};

const MoveOutDetail = ({ moveOut, onRefresh }) => {
  const queryClient = useQueryClient();
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === moveOut.status);
  const showInspection = currentIdx >= 1; // inspection_scheduled or later
  const showDeductions = currentIdx >= 2; // inspected or later
  const showRefund = currentIdx >= 3 && moveOut.status !== 'refund_processed' && moveOut.status !== 'completed';

  const refundMutation = useMutation({
    mutationFn: () => moveOutAPI.processRefund(moveOut.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['move-outs'] });
      onRefresh?.();
    },
  });

  return (
    <div className="space-y-4">
      <StepIndicator currentStatus={moveOut.status} />

      {/* Summary */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Move-Out Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Tenant:</span> {moveOut.tenant_name}</div>
          <div><span className="text-gray-500">Property:</span> {moveOut.property_title}</div>
          <div><span className="text-gray-500">Intended exit:</span> {moveOut.intended_exit_date}</div>
          <div><span className="text-gray-500">Actual exit:</span> {moveOut.actual_exit_date || 'Not yet'}</div>
        </div>
        {moveOut.tenant_note && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-500 mb-1">Tenant Note</p>
            <p className="text-sm">{moveOut.tenant_note}</p>
          </div>
        )}
        {moveOut.landlord_note && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-500 mb-1">Your Note</p>
            <p className="text-sm">{moveOut.landlord_note}</p>
          </div>
        )}
      </div>

      {/* Inspection */}
      {showInspection && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Inspection Checklist</h3>
          {moveOut.inspection ? (
            <InspectionChecklistForm inspection={moveOut.inspection} readOnly />
          ) : (
            <InspectionChecklistForm moveOutId={moveOut.id} onComplete={onRefresh} />
          )}
        </div>
      )}

      {/* Deductions */}
      {showDeductions && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Caution Fee Deductions</h3>
          <CautionDeductionsManager
            moveOutId={moveOut.id}
            deductions={moveOut.deductions || []}
            onRefresh={onRefresh}
            readOnly={moveOut.status === 'refund_processed' || moveOut.status === 'completed'}
          />
        </div>
      )}

      {/* Process Refund */}
      {showRefund && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Process Caution Refund</h3>
          <p className="text-sm text-gray-600 mb-3">
            Once you process the refund, the caution fee balance (minus deductions) will be returned to the tenant and the lease will be terminated.
          </p>
          <button
            onClick={() => refundMutation.mutate()}
            disabled={refundMutation.isPending}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium"
          >
            {refundMutation.isPending ? 'Processing...' : 'Process Refund & Close Lease'}
          </button>
          {refundMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              {refundMutation.error?.response?.data?.error || 'Failed to process refund'}
            </p>
          )}
          {refundMutation.isSuccess && (
            <p className="text-emerald-600 text-sm mt-2">Refund processed successfully!</p>
          )}
        </div>
      )}
    </div>
  );
};

const MoveOutWorkflow = () => {
  const [selected, setSelected] = useState(null);

  const { data: moveOuts = [], isLoading, refetch } = useQuery({
    queryKey: ['move-outs'],
    queryFn: () => moveOutAPI.list().then(r => r.data?.results || r.data || []),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
  }

  if (moveOuts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-1">No move-out requests</p>
        <p className="text-sm">Move-out requests from tenants will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Move-Out Requests</h2>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* List */}
        <div className="space-y-2 lg:col-span-1">
          {moveOuts.map(mo => (
            <MoveOutCard
              key={mo.id}
              moveOut={mo}
              onSelect={setSelected}
              isSelected={selected?.id === mo.id}
            />
          ))}
        </div>
        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <MoveOutDetail moveOut={selected} onRefresh={() => { refetch(); }} />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 border rounded-lg">
              Select a move-out request to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveOutWorkflow;
