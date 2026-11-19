// Pricing copy never contains the numbers themselves. It uses placeholders
// filled from the live rates the backend charges (core/pricing_page.py), so a
// rate change in Site Settings updates the page with it.

export const PRICING_TOKENS = {
  rent_rate: { label: 'Rent platform fee', suffix: '%' },
  stays_rate: { label: 'Short-stay commission', suffix: '%' },
  free_bookings: { label: 'Free bookings per host', suffix: '' },
  caution_rate: { label: 'Caution fee (of annual rent)', suffix: '%' },
  caution_interest: { label: 'Caution fee cashback', suffix: '%' },
};

export const formatToken = (key, rates) => {
  const value = rates?.[key];
  if (value === undefined || value === null) return `{${key}}`;
  return `${value}${PRICING_TOKENS[key]?.suffix ?? ''}`;
};

const TOKEN_RE = /\{([a-z_]+)\}/g;

export const fillTokens = (text, rates) =>
  (text || '').replace(TOKEN_RE, (match, key) => (key in PRICING_TOKENS ? formatToken(key, rates) : match));

// Lines about the free-bookings offer make no sense while it is switched off
// (free_bookings = 0), so they are hidden rather than reading "first 0 bookings".
export const mentionsOffer = (text) => (text || '').includes('{free_bookings}');
export const offerIsOn = (rates) => Number(rates?.free_bookings) > 0;
export const visibleLines = (lines, rates) =>
  (lines || []).filter((line) => offerIsOn(rates) || !mentionsOffer(line));

// Editor hints. A typed percentage is how the page once said 15% while the
// platform charged 10%; 100% is a figure of speech, not a rate.
export const typedPercentages = (text) =>
  ((text || '').match(/\d+(?:\.\d+)?\s?%/g) || []).filter((p) => p.replace(/\s/g, '') !== '100%');

export const unknownTokens = (text) =>
  [...(text || '').matchAll(TOKEN_RE)].map((m) => m[1]).filter((key) => !(key in PRICING_TOKENS));

export const naira = (n) =>
  `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;
