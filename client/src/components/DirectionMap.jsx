import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@luomus/leaflet-smooth-wheel-zoom';
import './DirectionMap.css';

import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// ── Custom SVG markers ────────────────────────────────────────

const pickupIcon = L.divIcon({
  className: 'direction-marker-pickup',
  html: `
    <div class="direction-marker-pickup-ripple"></div>
    <div class="direction-marker-pickup-dot"></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const dropoffPinSVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40">
  <path fill="#B3261E" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
  <circle fill="#ffffff" cx="12" cy="12" r="5"/>
</svg>
`);

const dropoffIcon = L.icon({
  iconUrl: `data:image/svg+xml;utf8,${dropoffPinSVG}`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
  shadowAnchor: [13, 41],
});

// ── FitBounds helper (with auto-recenter) ─────────────────────

const AUTO_RECENTER_DELAY = 5000; // ms after user pans before snapping back

function FitBoundsAndDrift({ positions, onDriftChange }) {
  const map = useMap();
  const prevData = useRef('');
  const driftTimer = useRef(null);

  // Initial fit
  useEffect(() => {
    if (!positions || positions.length === 0) return;
    const currentData = JSON.stringify(positions);
    if (prevData.current === currentData) return;
    prevData.current = currentData;

    if (positions.length === 1) {
      map.flyTo(positions[0], 14);
    } else {
      const bounds = L.latLngBounds(positions);
      map.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 15,
      });
    }
  }, [map, positions]);

  // Drift detection + auto-recenter
  useEffect(() => {
    if (!map || !positions || positions.length === 0) return;

    const checkAndScheduleRecenter = () => {
      const expectedBounds = L.latLngBounds(positions).pad(0.5);
      const isDrifted = !expectedBounds.contains(map.getCenter());
      onDriftChange(isDrifted);

      if (isDrifted) {
        // Clear previous timer
        if (driftTimer.current) clearTimeout(driftTimer.current);
        // Schedule auto-recenter
        driftTimer.current = setTimeout(() => {
          if (positions.length === 1) {
            map.flyTo(positions[0], 14);
          } else {
            map.flyToBounds(L.latLngBounds(positions), {
              padding: [80, 80],
              maxZoom: 15,
            });
          }
          onDriftChange(false);
        }, AUTO_RECENTER_DELAY);
      }
    };

    map.on('moveend', checkAndScheduleRecenter);
    return () => {
      map.off('moveend', checkAndScheduleRecenter);
      if (driftTimer.current) clearTimeout(driftTimer.current);
    };
  }, [map, positions, onDriftChange]);

  return null;
}

// ── Main Component ────────────────────────────────────────────

export default function DirectionMap({ pickupLat, pickupLng, dropLat, dropLng }) {
  const [isDrifted, setIsDrifted] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const mapRef = useRef(null);

  const pickup = useMemo(() => [pickupLat, pickupLng], [pickupLat, pickupLng]);
  const dropoff = useMemo(() => [dropLat, dropLng], [dropLat, dropLng]);
  const positions = useMemo(() => [pickup, dropoff], [pickup, dropoff]);

  // Straight line between pickup and dropoff — no OSRM route
  const linePositions = useMemo(() => [pickup, dropoff], [pickup, dropoff]);

  const center = useMemo(() => [
    (pickupLat + dropLat) / 2,
    (pickupLng + dropLng) / 2,
  ], [pickupLat, pickupLng, dropLat, dropLng]);

  const handleRecenter = useCallback(() => {
    setRecenterKey(k => k + 1);
    setIsDrifted(false);
  }, []);

  const handleDriftChange = useCallback((drifted) => {
    setIsDrifted(drifted);
  }, []);

  return (
    <div className="direction-map-wrapper">
      {/* Vignette overlay for cinematic edges */}
      <div className="direction-map-vignette" />
      <div className="direction-map-top-fade" />

      {/* 3D perspective container */}
      <div className="direction-map-3d">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={true}
          smoothWheelZoom={true}
          smoothSensitivity={1}
          dragging={true}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Dashed straight line — direction indicator */}
          <Polyline
            positions={linePositions}
            pathOptions={{
              color: '#0A56D1',
              weight: 4,
              dashArray: '12, 10',
              lineCap: 'round',
              opacity: 0.8,
            }}
          />

          {/* Pickup marker with pulsing ripple */}
          <Marker position={pickup} icon={pickupIcon} />

          {/* Dropoff marker — standard pin */}
          <Marker position={dropoff} icon={dropoffIcon} />

          <FitBoundsAndDrift
            positions={positions}
            onDriftChange={handleDriftChange}
            key={recenterKey}
          />
        </MapContainer>
      </div>

      {/* Recenter FAB — shows when user pans away, auto-hides after recenter */}
      {isDrifted && (
        <button
          onClick={handleRecenter}
          title="Recenter map"
          aria-label="Recenter map"
          className="direction-recenter-fab"
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
            <path d="M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400Z"/>
          </svg>
          <span>Recenter</span>
        </button>
      )}
    </div>
  );
}
