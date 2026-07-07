import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@luomus/leaflet-smooth-wheel-zoom";
import "./DirectionMap.css";

import markerShadow from "leaflet/dist/images/marker-shadow.png";

// ── Custom SVG markers ────────────────────────────────────────

const pickupIcon = L.divIcon({
  className: "direction-marker-pickup",
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

// ── Arc curve generator ───────────────────────────────────────
// Creates a quadratic bezier arc between two points.
// The control point is offset perpendicular to the midpoint,
// producing a curved "flight path" that looks elevated / 3D.

function generateArc(start, end, segments = 40, arcHeight = 0.15) {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  // Midpoint
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  // Perpendicular offset direction (rotate the direction vector 90°)
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);

  // Control point: offset perpendicular to the line
  // Negative perpLat pushes the arc "upward" on screen (north)
  const perpLat = -dLng / dist;
  const perpLng = dLat / dist;

  const controlLat = midLat + perpLat * dist * arcHeight;
  const controlLng = midLng + perpLng * dist * arcHeight;

  // Generate points along the quadratic bezier
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    const lat = u * u * lat1 + 2 * u * t * controlLat + t * t * lat2;
    const lng = u * u * lng1 + 2 * u * t * controlLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

// Generate a shadow arc — same shape but offset slightly south-east
// to simulate a shadow cast on the ground
function generateShadowArc(arcPoints, shadowOffset = 0.003) {
  return arcPoints.map(([lat, lng], i) => {
    // Taper the shadow offset so it is 0 at the start and end (touching the ground)
    const t = i / (arcPoints.length - 1);
    const factor = 4 * t * (1 - t); // Parabola: 0 at ends, 1 in middle
    return [lat - shadowOffset * factor, lng + shadowOffset * 0.5 * factor];
  });
}

// ── FitBounds helper (with auto-recenter) ─────────────────────

const AUTO_RECENTER_DELAY = 5000;

function FitBoundsAndDrift({ positions, onDriftChange }) {
  const map = useMap();
  const prevData = useRef("");
  const driftTimer = useRef(null);

  useEffect(() => {
    if (!positions || positions.length === 0) return;
    const currentData = JSON.stringify(positions);
    if (prevData.current === currentData) return;
    prevData.current = currentData;

    if (positions.length === 1) {
      map.flyTo(positions[0], 13);
    } else {
      // Pad bounds by 18% to zoom out slightly
      const bounds = L.latLngBounds(positions).pad(0.18);
      const isMobile = window.innerWidth < 768;
      map.flyToBounds(bounds, {
        paddingTopLeft: isMobile
          ? [40, 40]
          : [Math.min(window.innerWidth * 0.45, 600), 80],
        paddingBottomRight: isMobile ? [40, 320] : [80, 80],
        maxZoom: 15,
      });
    }
  }, [map, positions]);

  useEffect(() => {
    if (!map || !positions || positions.length === 0) return;

    const checkAndScheduleRecenter = () => {
      // Check if the current map bounds fully contain the route positions.
      // If we pad the map heavily, the geographical center shifts, so we can't just check map.getCenter().
      const routeBounds = L.latLngBounds(positions);
      const isDrifted = !map.getBounds().contains(routeBounds);
      onDriftChange(isDrifted);

      if (isDrifted) {
        if (driftTimer.current) clearTimeout(driftTimer.current);
        driftTimer.current = setTimeout(() => {
          if (positions.length === 1) {
            map.flyTo(positions[0], 13);
          } else {
            const isMobile = window.innerWidth < 768;
            map.flyToBounds(L.latLngBounds(positions).pad(0.18), {
              paddingTopLeft: isMobile
                ? [40, 40]
                : [Math.min(window.innerWidth * 0.45, 600), 80],
              paddingBottomRight: isMobile ? [40, 320] : [80, 80],
              maxZoom: 15,
            });
          }
          onDriftChange(false);
        }, AUTO_RECENTER_DELAY);
      }
    };

    map.on("moveend", checkAndScheduleRecenter);
    return () => {
      map.off("moveend", checkAndScheduleRecenter);
      if (driftTimer.current) clearTimeout(driftTimer.current);
    };
  }, [map, positions, onDriftChange]);

  return null;
}

// ── Main Component ────────────────────────────────────────────

export default function DirectionMap({
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
}) {
  const [isDrifted, setIsDrifted] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const mapRef = useRef(null);

  const pickup = useMemo(() => [pickupLat, pickupLng], [pickupLat, pickupLng]);
  const dropoff = useMemo(() => [dropLat, dropLng], [dropLat, dropLng]);
  const positions = useMemo(() => [pickup, dropoff], [pickup, dropoff]);

  // Generate the curved arc line (3D flight-path effect)
  const arcPoints = useMemo(
    () => generateArc(pickup, dropoff, 50, 0.15),
    [pickup, dropoff],
  );

  // Shadow arc — offset south-east to simulate shadow on ground
  // Scale shadow offset based on distance between points
  const shadowArc = useMemo(() => {
    const dLat = dropLat - pickupLat;
    const dLng = dropLng - pickupLng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    const shadowOffset = Math.max(0.002, dist * 0.025);
    return generateShadowArc(arcPoints, shadowOffset);
  }, [arcPoints, pickupLat, pickupLng, dropLat, dropLng]);

  const center = useMemo(
    () => [(pickupLat + dropLat) / 2, (pickupLng + dropLng) / 2],
    [pickupLat, pickupLng, dropLat, dropLng],
  );

  const handleRecenter = useCallback(() => {
    setRecenterKey((k) => k + 1);
    setIsDrifted(false);
  }, []);

  const handleDriftChange = useCallback((drifted) => {
    setIsDrifted(drifted);
  }, []);

  return (
    <div className="direction-map-wrapper">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        smoothWheelZoom={true}
        smoothSensitivity={1}
        dragging={true}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Shadow line — offset south-east, blurred gray, on ground */}
        <Polyline
          positions={shadowArc}
          pathOptions={{
            color: "#000000",
            weight: 5,
            opacity: 0.12,
            lineCap: "round",
            lineJoin: "round",
            dashArray: null,
          }}
          className="direction-shadow-line"
        />

        {/* Main arc line — elevated curved "flight path" */}
        <Polyline
          positions={arcPoints}
          pathOptions={{
            color: "#0A56D1",
            weight: 4,
            dashArray: "12, 10",
            lineCap: "round",
            opacity: 0.9,
          }}
          className="direction-arc-line"
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

      {/* Recenter FAB — shows when user pans away, auto-hides after recenter */}
      {isDrifted && (
        <button
          onClick={handleRecenter}
          title="Recenter map"
          aria-label="Recenter map"
          className="direction-recenter-fab"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="currentColor"
          >
            <path d="M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400Z" />
          </svg>
          <span>Recenter</span>
        </button>
      )}
    </div>
  );
}
