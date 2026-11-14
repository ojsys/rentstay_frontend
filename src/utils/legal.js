/**
 * Shared constants for the legal services (dispute case) screens.
 *
 * Kept out of the page components so both the case list and the case detail
 * can import them without tripping React Fast Refresh, which requires a
 * component file to export only components.
 */

export const CASE_STATUS_STYLES = {
  submitted: 'bg-sky-100 text-sky-700',
  in_review: 'bg-amber-100 text-amber-700',
  awaiting_info: 'bg-orange-100 text-orange-700',
  advice_issued: 'bg-indigo-100 text-indigo-700',
  escalated: 'bg-red-100 text-red-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-500',
};

export const CASE_PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-700',
  normal: 'bg-gray-100 text-gray-600',
  low: 'bg-gray-100 text-gray-400',
};

/** Order the legal team moves a case through. */
export const CASE_STATUS_FLOW = [
  'submitted', 'in_review', 'awaiting_info', 'advice_issued',
  'escalated', 'resolved', 'closed',
];


/**
 * Who may read and handle dispute cases.
 *
 * Mirrors `legal/access.py::is_legal_staff`. Deliberately **not** every
 * `is_staff` user: a content moderator has no reason to read tenancy disputes,
 * harassment complaints or a landlord's legal position. Superusers are
 * included so the platform owner cannot lock themselves out.
 *
 * The server enforces this regardless; this only decides what to render.
 */
export const isLegalStaff = (user) => Boolean(
  user?.is_legal_partner || user?.is_superuser || user?.user_type === 'admin'
);
