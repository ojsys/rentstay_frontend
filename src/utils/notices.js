/**
 * Shared constants for legal notices.
 *
 * Kept in one place so the composer, the template editor and any future screen
 * cannot drift out of sync with each other — or with NOTICE_TYPES in
 * backend/properties/notices.py, which this list mirrors.
 */

export const NOTICE_TYPES = [
  { value: 'quit', label: 'Notice to Quit' },
  { value: 'intention_to_recover', label: "Owner's Intention to Recover Possession" },
  { value: 'rent_demand', label: 'Demand for Outstanding Rent' },
  { value: 'rent_review', label: 'Notice of Rent Review' },
  { value: 'breach', label: 'Notice of Breach of Tenancy' },
  { value: 'other', label: 'Other Notice' },
];

export const noticeTypeLabel = (value) =>
  NOTICE_TYPES.find(t => t.value === value)?.label || value;

/** Stand-in values so a template preview reads like a real notice. */
export const NOTICE_SAMPLE_DATA = {
  landlord: 'John Landlord',
  tenant: 'Jane Tenant',
  property: '2 Bedroom Flat, Ikoyi',
  address: '123 Example Street, Lagos',
  rent_amount: '₦1,200,000.00',
  rent_term: 'annual',
  start_date: '01 January 2025',
  end_date: '31 December 2025',
  issued_date: '11 August 2026',
  expiry_date: '07 February 2027',
  notice_period: '6 months',
};

/** Substitute {{placeholders}} for preview. Mirrors render_body() on the server. */
export const renderNoticePreview = (template, data = NOTICE_SAMPLE_DATA) => {
  let out = template || '';
  Object.entries(data).forEach(([key, value]) => {
    out = out.replaceAll(`{{${key}}}`, String(value));
  });
  return out;
};
