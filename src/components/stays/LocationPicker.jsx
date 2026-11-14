import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Link2, Loader2, MapPin, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { staysAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { pinIcon, TILE_URL, TILE_ATTRIBUTION } from './mapIcon';

/**
 * Lets a host place their listing's pin by dragging it, instead of typing
 * decimal coordinates.
 *
 * The old form asked for `latitude` and `longitude` as two number inputs
 * behind a "GPS coordinates" toggle. Practically no host filled them in, so
 * the pin fell back to the linked property's coordinates — the estate centre,
 * or nothing — and guests arrived at the wrong place. Three ways in, in the
 * order hosts actually reach for them:
 *
 *   1. **Use my location** — the host is usually standing in the property.
 *   2. **Search** — type the street, pick a result.
 *   3. **Paste a Google Maps link** — most hosts have already found their
 *      building there, on their phone. Making them repeat that work on a
 *      second map is why the coordinate fields went unfilled in the first
 *      place. Resolved on the server (see `stays/maplink.py`); only the
 *      coordinates are kept, never the link.
 *   4. **Drag the pin** — always available, and the only one that gets you
 *      from "the right street" to "the right gate".
 */

// Lagos, as a starting view when there is nothing else to go on.
const FALLBACK = { lat: 6.5244, lng: 3.3792, zoom: 11 };

/** Keeps the map centred when the pin is moved from outside (search, GPS). */
const Recentre = ({ position, zoom }) => {
  const map = useMap();
  const last = useRef(null);
  useEffect(() => {
    if (!position) return;
    const key = `${position.lat},${position.lng}`;
    // Only fly when the pin actually moved elsewhere — otherwise every parent
    // re-render yanks the map back and the host cannot pan away to look around.
    if (last.current === key) return;
    last.current = key;
    map.flyTo([position.lat, position.lng], zoom ?? map.getZoom(), { duration: 0.6 });
  }, [position, zoom, map]);
  return null;
};

/** Clicking the map moves the pin there. */
const ClickToPlace = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

const LocationPicker = ({
  latitude,
  longitude,
  onChange,
  onAddressResolved,
  height = 340,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [link, setLink] = useState('');
  const [resolvingLink, setResolvingLink] = useState(false);
  const [flyTo, setFlyTo] = useState(null);

  const position = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
      ? { lat, lng }
      : null;
  }, [latitude, longitude]);

  const place = useCallback((lat, lng, { recentre = false, reverse = false } = {}) => {
    // Six decimals is roughly 0.1 m — past the point where more digits mean
    // anything, and it matches the model's decimal_places.
    const next = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    onChange(next);
    if (recentre) setFlyTo(next);
    if (reverse && onAddressResolved) {
      staysAPI.reverseGeocode(next.lat, next.lng)
        .then(({ data }) => {
          if (data?.address) onAddressResolved(data);
        })
        .catch(() => { /* the pin is what matters; the address is a convenience */ });
    }
  }, [onChange, onAddressResolved]);

  const search = async (e) => {
    e?.preventDefault();
    if (query.trim().length < 3) {
      toast.error('Type at least 3 characters to search');
      return;
    }
    setSearching(true);
    try {
      const { data } = await staysAPI.geocode(query.trim());
      setResults(data.results || []);
      if (!data.results?.length) {
        toast(data.detail || 'No matches — try a nearby landmark, or drop the pin yourself.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Address search failed. You can still drop the pin.'));
    } finally {
      setSearching(false);
    }
  };

  const applyLink = async (e) => {
    e?.preventDefault();
    const value = link.trim();
    if (!value) {
      toast.error('Paste a Google Maps link first');
      return;
    }
    setResolvingLink(true);
    try {
      const { data } = await staysAPI.resolveMapLink(value);
      place(Number(data.latitude), Number(data.longitude), { recentre: true, reverse: true });
      setLink('');
      // A link with no coordinates in it is resolved by looking its place name
      // up, which can land on the wrong end of the city. Say which happened,
      // so the host knows whether the pin needs checking.
      if (data.source === 'name') {
        toast('Found that place by name — check the pin is on your building, and drag it if not.',
          { icon: '📍', duration: 6000 });
      } else {
        toast.success('Pin moved to the location in that link');
      }
    } catch (err) {
      toast.error(getErrorMessage(
        err,
        "Couldn't read a location from that link. Try Share \u2192 Copy link in Google Maps.",
      ));
    } finally {
      setResolvingLink(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('This browser cannot share your location. Drag the pin instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        place(pos.coords.latitude, pos.coords.longitude, { recentre: true, reverse: true });
        toast.success('Pin moved to your current location');
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Search for the address or drag the pin.'
            : 'Could not get your location. Search for the address or drag the pin.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const centre = position || FALLBACK;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <form onSubmit={search} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input w-full pl-9"
              placeholder="Search your street or a nearby landmark"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button type="submit" disabled={searching} className="btn btn-secondary btn-sm px-4 flex items-center gap-1.5">
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="btn btn-secondary btn-sm px-4 flex items-center gap-1.5 whitespace-nowrap"
            title="Place the pin at your current location"
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
            <span className="hidden sm:inline">Use my location</span>
          </button>
        </form>

        {results.length > 0 && (
          <ul className="absolute z-[500] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {results.map((r, i) => (
              <li key={`${r.latitude}-${r.longitude}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    place(Number(r.latitude), Number(r.longitude), { recentre: true });
                    setResults([]);
                    setQuery(r.label.split(',').slice(0, 2).join(','));
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm text-dark-700 hover:bg-gray-50 flex items-start gap-2"
                >
                  <MapPin size={13} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="leading-snug">{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Google Maps link. Its own <form> — like the search above — so that
          Enter here resolves the link instead of submitting the whole listing
          form this picker sits inside. */}
      <form onSubmit={applyLink} className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="input w-full pl-9"
            placeholder="Or paste a Google Maps link"
            aria-label="Google Maps link"
            inputMode="url"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={resolvingLink || !link.trim()}
          className="btn btn-secondary btn-sm px-4 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
          title="Move the pin to the location in this link"
        >
          {resolvingLink ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          Use link
        </button>
      </form>
      <p className="text-xs text-dark-400 -mt-1">
        In Google Maps, find your building, then tap <span className="font-medium">Share &rarr; Copy link</span>.
        We only keep the coordinates, not the link.
      </p>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height }}>
        <MapContainer
          center={[centre.lat, centre.lng]}
          zoom={position ? 17 : FALLBACK.zoom}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <ClickToPlace onPick={(lat, lng) => place(lat, lng, { reverse: !position })} />
          <Recentre position={flyTo} zoom={17} />
          {position && (
            <Marker
              position={[position.lat, position.lng]}
              icon={pinIcon()}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  place(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-xs text-dark-500 flex items-start gap-1.5">
          <MapPin size={12} className="mt-0.5 flex-shrink-0 text-primary" />
          {position
            ? 'Drag the pin onto your building. Guests use this to find you.'
            : 'Tap the map, search above, or use your location to place the pin.'}
        </p>
        {position && (
          <span className="text-[11px] font-mono text-dark-400">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </span>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
