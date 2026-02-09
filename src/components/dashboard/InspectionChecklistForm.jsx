import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moveOutAPI } from '../../services/api';

const CHECKLIST_ITEMS = [
  { key: 'walls_ok', label: 'Walls & Paint' },
  { key: 'floors_ok', label: 'Floors & Tiles' },
  { key: 'plumbing_ok', label: 'Plumbing' },
  { key: 'electrical_ok', label: 'Electrical' },
  { key: 'doors_ok', label: 'Doors & Windows' },
  { key: 'keys_returned', label: 'Keys Returned' },
];

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-700' },
  { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-700' },
  { value: 'fair', label: 'Fair', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'poor', label: 'Poor', color: 'bg-red-100 text-red-700' },
];

const InspectionChecklistForm = ({ moveOutId, inspection, readOnly = false, onComplete }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    walls_ok: inspection?.walls_ok ?? true,
    floors_ok: inspection?.floors_ok ?? true,
    plumbing_ok: inspection?.plumbing_ok ?? true,
    electrical_ok: inspection?.electrical_ok ?? true,
    doors_ok: inspection?.doors_ok ?? true,
    keys_returned: inspection?.keys_returned ?? false,
    overall_condition: inspection?.overall_condition || 'good',
    notes: inspection?.notes || '',
  });

  const submitMutation = useMutation({
    mutationFn: (data) => moveOutAPI.submitInspection(moveOutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['move-outs'] });
      onComplete?.();
    },
  });

  const handleToggle = (key) => {
    if (readOnly) return;
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(form);
  };

  if (readOnly && inspection) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CHECKLIST_ITEMS.map(item => (
            <div key={item.key} className="flex items-center gap-2 text-sm">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                inspection[item.key] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {inspection[item.key] ? '\u2713' : '\u2717'}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Overall:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            CONDITION_OPTIONS.find(c => c.value === inspection.overall_condition)?.color || 'bg-gray-100'
          }`}>
            {inspection.overall_condition}
          </span>
        </div>
        {inspection.notes && (
          <p className="text-sm text-gray-600">{inspection.notes}</p>
        )}
        {inspection.inspected_by_name && (
          <p className="text-xs text-gray-400">
            Inspected by {inspection.inspected_by_name} on {inspection.inspected_at ? new Date(inspection.inspected_at).toLocaleDateString() : 'N/A'}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CHECKLIST_ITEMS.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleToggle(item.key)}
            className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${
              form[item.key]
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-red-300 bg-red-50 text-red-700'
            }`}
          >
            <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
              form[item.key] ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {form[item.key] ? '\u2713' : '\u2717'}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Overall Condition</label>
        <div className="flex gap-2">
          {CONDITION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, overall_condition: opt.value }))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                form.overall_condition === opt.value ? opt.color + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="Additional inspection notes..."
        />
      </div>

      <button
        type="submit"
        disabled={submitMutation.isPending}
        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium"
      >
        {submitMutation.isPending ? 'Submitting...' : 'Submit Inspection'}
      </button>
      {submitMutation.isError && (
        <p className="text-red-500 text-sm">
          {submitMutation.error?.response?.data?.error || 'Failed to submit inspection'}
        </p>
      )}
    </form>
  );
};

export default InspectionChecklistForm;
