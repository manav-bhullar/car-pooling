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

// ── FitBounds: fly to all stops when stops change ──────────────────
function FitBounds({ positions, fitBoundsOptions }) {
  const map = useMap();
  const prevData = useRef('');

  useEffect(() => {
    if (!positions || positions.length === 0) return;

    const currentData = JSON.stringify({ positions, fitBoundsOptions });
    if (prevData.current === currentData) return;
    prevData.current = currentData;

    if (positions.length === 1) {
      map.flyToBounds([positions[0], positions[0]], {
        ...fitBoundsOptions,
        padding: fitBoundsOptions?.padding || [40, 40],
        maxZoom: 14
      });
      return;
    }
    map.flyToBounds(positions.map((p) => [p[0], p[1]]), {
      ...fitBoundsOptions,
      padding: fitBoundsOptions?.padding || [40, 40]
    });
  }, [map, positions, fitBoundsOptions]);

  return null;
}

// ── SpeedZoom: adjusts map zoom based on current speed ─────────────
// Google Maps equivalent: slow speed → zoom in (street level)
// High speed → zoom out (see more of the road ahead)
function SpeedZoom({ speed }) {
  const map = useMap();
  const prevSpeed = useRef(null);

  useEffect(() => {
    if (speed == null) return;
    if (prevSpeed.current === speed) return;
    prevSpeed.current = speed;

    // speed is in m/s. Map to zoom level:
    // 0–5 m/s  (walking / crawl)  → zoom 17
    // 5–15 m/s (city streets ~50kph) → zoom 16
    // 15–25 m/s (suburban ~80kph)   → zoom 15
    // 25+ m/s (highway ~90+kph)     → zoom 14
    let targetZoom;
    if (speed < 5)       targetZoom = 17;
    else if (speed < 15) targetZoom = 16;
    else if (speed < 25) targetZoom = 15;
    else                 targetZoom = 14;

    const current = map.getZoom();
    if (Math.abs(current - targetZoom) >= 1) {
      map.setZoom(targetZoom, { animate: true });
    }
  }, [map, speed]);

  return null;
}

function FlyToLocation({ flyToRef }) {
  const map = useMap();

  useEffect(() => {
    flyToRef.current = (lat, lng, zoom = 15) => {
      map.flyTo([lat, lng], zoom);
    };
  }, [map, flyToRef]);

  return null;
}

// ── DriftTracker: detects when user has panned away from target ───
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
      // Use a padded bounding box around route/markers to define "centered" zone
      const expectedBounds = L.latLngBounds(t.map(p => [p[0], p[1]])).pad(0.5);
      onDriftChange(!expectedBounds.contains(map.getCenter()));
    };
    map.on('moveend', checkDrift);
    return () => { map.off('moveend', checkDrift); };
  }, [map, onDriftChange]);

  return null;
}

// ── SVG icons ──────────────────────────────────────────────────────
const getPinSVG = (color) => encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
  <path fill="${color}" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
  <circle fill="#ffffff" cx="12" cy="12" r="5"/>
</svg>
`);

const getMarkerIcon = (type) => {
  const color = type === 'PICKUP' ? '#0A56D1' : '#B3261E';
  const width = 28;
  const height = 42;
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${getPinSVG(color)}`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
  });
};

// Active car icon — uses L.divIcon so CSS transition:rotate animates smoothly
// without Leaflet replacing the entire DOM element on every GPS update.
const getActiveDivIcon = (bearing) =>
  L.divIcon({
    className: '',   // suppress Leaflet's default white-box class
    html: `
      <div style="
        width:48px; height:48px;
        transform: rotate(${bearing}deg);
        transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
        will-change: transform;
        display:flex; align-items:center; justify-content:center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48">
          <!-- Car body -->
          <rect x="20" y="10" width="24" height="44" rx="10" ry="10" fill="#0A56D1" stroke="#ffffff" stroke-width="3"/>
          <!-- Windshield -->
          <rect x="23" y="14" width="18" height="12" rx="3" ry="3" fill="rgba(255,255,255,0.55)"/>
          <!-- Rear window -->
          <rect x="23" y="38" width="18" height="9" rx="3" ry="3" fill="rgba(255,255,255,0.35)"/>
          <!-- Left wheels -->
          <rect x="13" y="16" width="8" height="13" rx="3" fill="#1a1a2e"/>
          <rect x="13" y="35" width="8" height="13" rx="3" fill="#1a1a2e"/>
          <!-- Right wheels -->
          <rect x="43" y="16" width="8" height="13" rx="3" fill="#1a1a2e"/>
          <rect x="43" y="35" width="8" height="13" rx="3" fill="#1a1a2e"/>
        </svg>
      </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
const getIdleCarSVG = () => encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="52" height="52">
  <!-- Shadow -->
  <ellipse cx="32" cy="58" rx="16" ry="5" fill="rgba(0,0,0,0.18)"/>
  <!-- Car body -->
  <rect x="18" y="10" width="28" height="42" rx="11" ry="11" fill="#fae366" stroke="#000000" stroke-width="3"/>
  <!-- Windshield -->
  <rect x="22" y="14" width="20" height="13" rx="4" ry="4" fill="rgba(0,0,0,0.35)"/>
  <!-- Rear window -->
  <rect x="22" y="37" width="20" height="9" rx="4" ry="4" fill="rgba(0,0,0,0.25)"/>
  <!-- Headlights -->
  <rect x="22" y="10" width="8" height="4" rx="2" fill="#fffde7" stroke="#ccc" stroke-width="1"/>
  <rect x="34" y="10" width="8" height="4" rx="2" fill="#fffde7" stroke="#ccc" stroke-width="1"/>
  <!-- Left wheels -->
  <rect x="11" y="17" width="8" height="12" rx="3" fill="#222"/>
  <rect x="11" y="35" width="8" height="12" rx="3" fill="#222"/>
  <!-- Right wheels -->
  <rect x="45" y="17" width="8" height="12" rx="3" fill="#222"/>
  <rect x="45" y="35" width="8" height="12" rx="3" fill="#222"/>
</svg>
`);


const getIdleCarIcon = () =>
  L.icon({
    iconUrl: `data:image/svg+xml;utf8,${getIdleCarSVG()}`,
    iconSize: [52, 52],
    iconAnchor: [26, 52],
  });

// ── DriverMap ──────────────────────────────────────────────────────
export default function DriverMap({
  stops = [],
  fitBoundsOptions,
  defaultCenter,
  driverLocation,
  pickupMarkers = [],
  idleDriverLocation = null,   // driver GPS when NOT in a trip
  compassHeading = null,       // live compass bearing from DeviceOrientationEvent
}) {
  const flyToRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const hasFlewToUser = useRef(false);
  const [isDrifted, setIsDrifted] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);

  // On mount: get real GPS and fly there once
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (!hasFlewToUser.current && flyToRef.current) {
          flyToRef.current(loc.lat, loc.lng, 16);
          hasFlewToUser.current = true;
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fly to user location once flyToRef is registered
  useEffect(() => {
    if (userLocation && flyToRef.current && !hasFlewToUser.current) {
      flyToRef.current(userLocation.lat, userLocation.lng, 16);
      hasFlewToUser.current = true;
    }
  }, [userLocation]);


  const sortedStops = useMemo(
    () =>
      (stops || [])
        .slice()
        .filter((s) => s && typeof s.lat === 'number' && typeof s.lng === 'number')
        .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0)),
    [stops]
  );

  const positions = useMemo(() => sortedStops.map((s) => [s.lat, s.lng]), [sortedStops]);

  const [routePositions, setRoutePositions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (positions.length > 1) {
      fetchOSRMRoute(positions).then((route) => {
        if (isMounted) setRoutePositions(route);
      });
    } else {
      setRoutePositions(positions);
    }
    return () => { isMounted = false; };
  }, [positions]);

  const boundsPositions = useMemo(() => {
    const pos = [...positions];
    if (pickupMarkers?.length > 0) {
      pickupMarkers.forEach((m) => pos.push([m.lat, m.lng]));
    }
    return pos;
  }, [positions, pickupMarkers]);

  const handleMyLocation = useCallback(() => {
    setIsDrifted(false);
    
    // 1. Active trip: fly to the moving car at zoom 17
    if (driverLocation && flyToRef.current) {
      flyToRef.current(driverLocation.lat, driverLocation.lng, 17);
      return;
    }
    
    // 2. Idle state: fly to the real GPS location at zoom 17
    if (idleDriverLocation && flyToRef.current) {
      flyToRef.current(idleDriverLocation.lat, idleDriverLocation.lng, 17);
      return;
    }
    
    // 3. Fallback to userLocation if we have it
    if (userLocation && flyToRef.current) {
      flyToRef.current(userLocation.lat, userLocation.lng, 17);
      return;
    }
    
    // 4. Fallback to route bounds
    if (boundsPositions.length > 0) {
      setRecenterCount(c => c + 1);
      return;
    }

    // 5. Final fallback: request browser location again
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        flyToRef.current?.(latitude, longitude, 17);
      },
      () => alert('Could not get your location. Please enable GPS.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [driverLocation, idleDriverLocation, userLocation, boundsPositions]);

  const center = useMemo(() => {
    if (driverLocation) return [driverLocation.lat, driverLocation.lng];
    if (idleDriverLocation) return [idleDriverLocation.lat, idleDriverLocation.lng];
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (positions.length > 0) return positions[0];
    return defaultCenter;
  }, [driverLocation, idleDriverLocation, userLocation, positions, defaultCenter]);

  // Build drift tracking targets: either route stops or pickup markers
  const driftTargetPositions = useMemo(() => {
    if (boundsPositions.length > 0) return boundsPositions;
    if (userLocation) return [[userLocation.lat, userLocation.lng]];
    return center ? [center] : [];
  }, [boundsPositions, userLocation, center]);

  return (
    <>
    <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', zIndex: 0 }}>
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

        <FlyToLocation flyToRef={flyToRef} />

        {/* Route stops markers (trip view) */}
        {sortedStops.map((s) => (
          <Marker key={s.id || s.stopOrder} position={[s.lat, s.lng]} icon={getMarkerIcon(s.type)}>
            <Popup>{s.type === 'PICKUP' ? 'Pickup' : 'Dropoff'} (Stop {s.stopOrder})</Popup>
          </Marker>
        ))}

        {/* Available trip pickup markers (dashboard view) */}
        {pickupMarkers.map((m, i) => (
          <Marker key={m.id || i} position={[m.lat, m.lng]} icon={getMarkerIcon('PICKUP')}>
            <Popup>Trip Request Pickup</Popup>
          </Marker>
        ))}

        {/* Route polyline */}
        {positions.length > 0 && (
          <Polyline
            positions={routePositions.length > 0 ? routePositions : positions}
            pathOptions={{ color: '#0A56D1', weight: 5, lineCap: 'round', lineJoin: 'round' }}
          />
        )}

        {/* Active trip: smooth-rotating car icon via CSS divIcon */}
        {driverLocation && (
          <Marker
            position={[driverLocation.lat, driverLocation.lng]}
            icon={getActiveDivIcon(driverLocation.bearing || 0)}
            zIndexOffset={1000}
          />
        )}

        {/* Speed-based dynamic zoom — Google Maps navigation style */}
        {driverLocation && <SpeedZoom speed={driverLocation.speed} />}

        {/* Idle driver: yellow parked car — rotates with compass when stationary */}
        {!driverLocation && idleDriverLocation && (
          <Marker
            position={[idleDriverLocation.lat, idleDriverLocation.lng]}
            icon={L.divIcon({
              className: '',
              html: `<div style="
                width:52px; height:52px;
                transform: rotate(${compassHeading ?? 0}deg);
                transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
                will-change: transform;
                display:flex; align-items:center; justify-content:center;
              ">${decodeURIComponent(getIdleCarSVG())}</div>`,
              iconSize: [52, 52],
              iconAnchor: [26, 52],
            })}
            zIndexOffset={900}
          >
            <Popup>Your current location</Popup>
          </Marker>
        )}

        {boundsPositions.length > 0 && (
          <FitBounds positions={boundsPositions} fitBoundsOptions={fitBoundsOptions} key={recenterCount} />
        )}
        <DriftTracker targetPositions={driftTargetPositions} onDriftChange={setIsDrifted} />
      </MapContainer>
    </div>

    {/* Recenter FAB — rendered OUTSIDE the z-index:0 map container so it floats above the panel */}
    {isDrifted && (
      <button
        onClick={handleMyLocation}
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
    </>
  );
}
