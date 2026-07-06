import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { fetchOSRMRoute } from '../utils/routing';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@luomus/leaflet-smooth-wheel-zoom';

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

function FitBounds({ positions, fitBoundsOptions }) {
  const map = useMap();
  const prevData = useRef('');

  useEffect(() => {
    if (!positions || positions.length === 0) return;

    // Deep compare to prevent infinite vibration loops from parent re-renders
    const currentData = JSON.stringify({ positions, fitBoundsOptions });
    if (prevData.current === currentData) {
      return;
    }
    prevData.current = currentData;

    if (positions.length === 1) {
      // We use flyToBounds even for a single point so that the map padding options are applied!
      // This prevents the single marker from hiding under the glass card on the left.
      const singleBound = [positions[0], positions[0]];
      map.flyToBounds(singleBound, { 
        ...fitBoundsOptions, 
        padding: fitBoundsOptions?.padding || [40, 40], 
        maxZoom: 16 
      });
      return;
    }
    const bounds = positions.map((p) => [p[0], p[1]]);
    // Cinematic flight when framing the route
    map.flyToBounds(bounds, { ...fitBoundsOptions, padding: fitBoundsOptions?.padding || [40, 40] });
  }, [map, positions, fitBoundsOptions]);

  return null;
}

// Detects when the user has dragged/panned away from the target route bounds
function DriftTracker({ targetPositions, onDriftChange }) {
  const map = useMap();
  const targetRef = useRef(targetPositions);

  useEffect(() => {
    targetRef.current = targetPositions;
  }, [targetPositions]);

  useEffect(() => {
    if (!map) return;

    const checkDrift = () => {
      const t = targetRef.current;
      if (!t || t.length === 0) return;
      // Build expected bounds from target positions
      const expectedBounds = L.latLngBounds(t.map(p => [p[0], p[1]])).pad(0.5);
      const currentCenter = map.getCenter();
      const isDrifted = !expectedBounds.contains(currentCenter);
      onDriftChange(isDrifted);
    };

    map.on('moveend', checkDrift);
    return () => { map.off('moveend', checkDrift); };
  }, [map, onDriftChange]);

  return null;
}

const getPinSVG = (color) => encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
  <path fill="${color}" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
  <circle fill="#ffffff" cx="12" cy="12" r="5"/>
</svg>
`);

const getMarkerIcon = (type, isMyStop = true) => {
  // M3 Expressive Baseline colors: Azure Blue for Pickup, Crimson Red for Dropoff
  let color = type === 'PICKUP' ? '#0A56D1' : '#B3261E'; 
  let scale = 1;

  if (!isMyStop) {
    color = '#9E9E9E'; // Material Grey 500 for other passengers' stops
    scale = 0.75;
  }
  
  const width = 28 * scale;
  const height = 42 * scale;
  
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${getPinSVG(color)}`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
    shadowUrl: markerShadow,
    shadowSize: [41 * scale, 41 * scale],
    shadowAnchor: [13 * scale, 41 * scale]
  });
};

const getCarSVG = (bearing) => encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
  <g transform="rotate(${bearing} 12 12)">
    <path fill="#0A56D1" stroke="#FFFFFF" stroke-width="2" d="M12 2L4 20l1.5 1.5L12 17l6.5 4.5L20 20 12 2z" />
  </g>
</svg>
`);

const getCarIcon = (bearing) => {
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${getCarSVG(bearing)}`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export default function TripMap({ stops = [], fitBoundsOptions, defaultCenter, myRideRequestId, driverLocation }) {
  const [isDrifted, setIsDrifted] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);

  const handleRecenter = useCallback(() => {
    setRecenterCount(c => c + 1);
    setIsDrifted(false);
  }, []);

  const sortedStops = useMemo(() => (
    (stops || [])
      .slice()
      .filter(s => s && typeof s.lat === 'number' && typeof s.lng === 'number')
      .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0))
  ), [stops]);

  const positions = useMemo(() => sortedStops.map(s => [s.lat, s.lng]), [sortedStops]);

  const [routePositions, setRoutePositions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (positions.length > 1) {
      fetchOSRMRoute(positions).then(route => {
        if (isMounted) setRoutePositions(route);
      });
    } else {
      setRoutePositions(positions);
    }
    return () => { isMounted = false; };
  }, [positions]);

  if (!sortedStops.length && !defaultCenter) {
    return <div className="map-empty">No map data available</div>;
  }

  const center = positions.length > 0 ? positions[0] : defaultCenter;

  return (
    <div className="trip-map" style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer 
        center={center} 
        zoom={16} 
        scrollWheelZoom={false}
        smoothWheelZoom={true}
        smoothSensitivity={1}
        zoomControl={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sortedStops.map((s) => {
          const isMyStop = myRideRequestId ? s.rideRequestId === myRideRequestId : true;
          return (
            <Marker key={s.stopOrder} position={[s.lat, s.lng]} icon={getMarkerIcon(s.type, isMyStop)}>
              <Popup>
                {isMyStop 
                  ? (s.type === 'PICKUP' ? `Your Pickup` : `Your Dropoff`)
                  : (s.type === 'PICKUP' ? `Co-rider Pickup` : `Co-rider Dropoff`)
                } (Stop {s.stopOrder})
              </Popup>
            </Marker>
          );
        })}

        <Polyline positions={routePositions.length > 0 ? routePositions : positions} pathOptions={{ color: '#0A56D1', weight: 5, lineCap: 'round', lineJoin: 'round' }} />

        {driverLocation && (
          <Marker 
            position={[driverLocation.lat, driverLocation.lng]} 
            icon={getCarIcon(driverLocation.bearing || 0)} 
            zIndexOffset={1000}
          />
        )}

        <FitBounds positions={positions} fitBoundsOptions={fitBoundsOptions} key={recenterCount} />
        <DriftTracker targetPositions={positions} onDriftChange={setIsDrifted} />
      </MapContainer>

      {/* Recenter FAB — only visible when user has panned away */}
      {isDrifted && (
        <button
          onClick={handleRecenter}
          title="Recenter map"
          aria-label="Recenter map"
          className="recenter-fab"
        >
          {/* Material Symbols: my_location */}
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
            <path d="M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400Z"/>
          </svg>
          <span>Recenter</span>
        </button>
      )}
    </div>
  );
}
