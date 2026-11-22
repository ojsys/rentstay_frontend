/**
 * Canonical URLs for things people share.
 *
 * Two different links, for two different jobs:
 *
 *  - `listingPath` is where the app navigates. Prefers the slug, falls back to
 *    the id so a listing serialised before slugs existed still resolves.
 *  - `listingShareUrl` points at the **backend**, which renders Open Graph
 *    tags server-side. Social crawlers do not run JavaScript, so a link to the
 *    React app previews as a bare URL no matter what the page sets. The share
 *    page carries the picture and then forwards the person to the app.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://www.myrentstay.com';

/** In-app route for a listing. */
export const listingPath = (listing, search = '') => {
  const key = listing?.slug || listing?.id;
  return `/stays/listings/${key}${search || ''}`;
};

/** The URL to give someone else — previews correctly in chat apps. */
export const listingShareUrl = (listing) => shareUrl('stay', listing);

/** In-app route for a rental property. */
export const propertyPath = (property) =>
  `/properties/${property?.slug || property?.id}`;

/** Shareable URL for a rental property. */
export const propertyShareUrl = (property) => shareUrl('rent', property);

/**
 * Backend share URL for either kind of listing.
 *
 * `kind` is the path segment the backend registers: 'stay' or 'rent'.
 */
function shareUrl(kind, item) {
  const key = item?.slug || item?.id;
  return `${API_BASE.replace(/\/$/, '')}/s/${kind}/${key}`;
}

export default listingPath;
