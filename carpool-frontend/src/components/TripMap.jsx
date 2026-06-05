import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths for bundlers (Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FitBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }
    const bounds = positions.map((p) => [p[0], p[1]]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, positions]);

  return null;
}

export default function TripMap({ stops = [] }) {
  const sortedStops = useMemo(() => (
    (stops || [])
      .slice()
      .filter(s => s && typeof s.lat === 'number' && typeof s.lng === 'number')
      .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0))
  ), [stops]);

  const positions = useMemo(() => sortedStops.map(s => [s.lat, s.lng]), [sortedStops]);

  if (!sortedStops.length) {
    return <div className="map-empty">No map data available</div>;
  }

  const center = positions[0];

  return (
    <div className="trip-map" style={{ height: '320px', width: '100%' }}>
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sortedStops.map((s) => (
          <Marker key={s.stopOrder} position={[s.lat, s.lng]}>
            <Popup>
              {s.type === 'PICKUP' ? `Pickup (stop ${s.stopOrder})` : `Dropoff (stop ${s.stopOrder})`}
            </Popup>
          </Marker>
        ))}

        <Polyline positions={positions} pathOptions={{ color: '#1976d2', weight: 4 }} />

        <FitBounds positions={positions} />
      </MapContainer>
    </div>
  );
}
