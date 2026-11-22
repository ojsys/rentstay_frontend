import L from 'leaflet';

/**
 * Leaflet's default marker points at image files it resolves relative to the
 * CSS. Under Vite those paths do not survive bundling and every marker renders
 * as a broken image, so both maps here draw their own pin as inline HTML
 * instead. No assets, nothing to break at build time.
 */
export const pinIcon = (colour = '#0EA5E9') =>
  L.divIcon({
    className: 'rentstay-pin',
    html: `
      <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 27 15 27s15-16 15-27c0-8.3-6.7-15-15-15z"
              fill="${colour}" stroke="#fff" stroke-width="2.5"/>
        <circle cx="15" cy="15" r="5.5" fill="#fff"/>
      </svg>`,
    iconSize: [30, 42],
    // Anchor at the point of the pin, not its centre, or the marker sits half
    // a building south of where it is meant to be.
    iconAnchor: [15, 42],
  });

// OSM's tile policy: no a./b./c. subdomains (deprecated), and the request must
// carry a Referer — the backend's SECURE_REFERRER_POLICY sees to that. A 403
// on tiles means the Referer went missing again.
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
