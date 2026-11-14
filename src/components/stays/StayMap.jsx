import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { pinIcon, TILE_URL, TILE_ATTRIBUTION } from './mapIcon';

/**
 * The listing's location map.
 *
 * Renders one of two things, decided by the server, never by this component:
 *
 * * an **exact pin** — the host, or a guest whose booking is confirmed;
 * * an **approximate circle** — everyone else. The circle's centre is already
 *   offset server-side, so it is not a marker in disguise.
 *
 * `radiusMetres` is the switch: present means approximate. The frontend is not
 * trusted to make that call, because a rule enforced in two places is a rule
 * that eventually disagrees with itself.
 */
const StayMap = ({
  latitude,
  longitude,
  radiusMetres = null,
  height = 300,
  zoom = null,
  interactive = true,
}) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const approximate = Boolean(radiusMetres);
  // Zoom out for a circle: showing a 500 m blur at street zoom implies a
  // precision that is not there.
  const level = zoom ?? (approximate ? 14 : 16);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={level}
      scrollWheelZoom={false}
      dragging={interactive}
      doubleClickZoom={interactive}
      style={{ height, width: '100%' }}
      className="rounded-2xl z-0"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {approximate ? (
        <Circle
          center={[lat, lng]}
          radius={Number(radiusMetres)}
          pathOptions={{ color: '#0EA5E9', fillColor: '#0EA5E9', fillOpacity: 0.15, weight: 2 }}
        />
      ) : (
        <Marker position={[lat, lng]} icon={pinIcon()} />
      )}
    </MapContainer>
  );
};

export default StayMap;
