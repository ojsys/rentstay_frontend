import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moveOutAPI } from '../../services/api';

const CautionDeductionsManager = ({ moveOutId, deductions = [], onRefresh, readOnly = false }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const addMutation = useMutation({
    mutationFn: (data) => moveOutAPI.addDeduction(moveOutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['move-outs'] });
      setDescription('');
      setAmount('');
      setShowForm(false);
      onRefresh?.();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (deductionId) => moveOutAPI.removeDeduction(moveOutId, deductionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['move-outs'] });
      onRefresh?.();
    },
  });

  const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    addMutation.mutate({ description: description.trim(), amount: Number(amount) });
  };

  return (
    <div className="space-y-3">
      {/* Deductions List */}
      {deductions.length > 0 ? (
        <div className="space-y-2">
          {deductions.map(d => (
            <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">{d.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(d.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-red-600">
                  -&#8358;{Number(d.amount).toLocaleString()}
                </span>
                {!readOnly && (
                  <button
                    onClick={() => removeMutation.mutate(d.id)}
                    disabled={removeMutation.isPending}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium text-gray-700">Total Deductions</span>
            <span className="text-sm font-bold text-red-600">
              &#8358;{totalDeductions.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No deductions added yet.</p>
      )}

      {/* Add Deduction Form */}
      {!readOnly && (
        <>
          {showForm ? (
            <form onSubmit={handleAdd} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (e.g., Broken door handle)"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Amount"
                min="1"
                step="0.01"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700"
                >
                  {addMutation.isPending ? 'Adding...' : 'Add Deduction'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
              {addMutation.isError && (
                <p className="text-red-500 text-xs">
                  {addMutation.error?.response?.data?.error || 'Failed to add deduction'}
                </p>
              )}
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              + Add Deduction
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default CautionDeductionsManager;
