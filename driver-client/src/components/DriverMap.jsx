import { useMemo, useEffect, useRef } from 'react';
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

function FitBounds({ positions, fitBoundsOptions }) {
  const map = useMap();
  const prevData = useRef('');

  useEffect(() => {
    if (!positions || positions.length === 0) return;

    const currentData = JSON.stringify({ positions, fitBoundsOptions });
    if (prevData.current === currentData) {
      return;
    }
    prevData.current = currentData;

    if (positions.length === 1) {
      const singleBound = [positions[0], positions[0]];
      map.flyToBounds(singleBound, { 
        ...fitBoundsOptions, 
        padding: fitBoundsOptions?.padding || [40, 40], 
        maxZoom: 14, 
        duration: 1.5, 
        easeLinearity: 0.2 
      });
      return;
    }
    const bounds = positions.map((p) => [p[0], p[1]]);
    map.flyToBounds(bounds, { ...fitBoundsOptions, padding: fitBoundsOptions?.padding || [40, 40], duration: 1.5, easeLinearity: 0.2 });
  }, [map, positions, fitBoundsOptions]);

  return null;
}

const getPinSVG = (color) => encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
  <path fill="${color}" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
  <circle fill="#ffffff" cx="12" cy="12" r="5"/>
</svg>
`);

const getMarkerIcon = (type) => {
  // M3 Expressive Baseline colors: Azure Blue for Pickup, Crimson Red for Dropoff
  let color = type === 'PICKUP' ? '#0A56D1' : '#B3261E'; 
  
  const width = 28;
  const height = 42;
  
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${getPinSVG(color)}`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
    shadowAnchor: [13, 41]
  });
};

const getCarSVG = (bearing) => encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
  <g transform="rotate(${bearing} 12 12)">
    <path fill="#0A56D1" stroke="#FFFFFF" stroke-width="2" d="M12 2L4 20l1.5 1.5L12 17l6.5 4.5L20 20 12 2z" />
  </g>
</svg>
`);

const getCarIcon = (bearing) => {
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${getCarSVG(bearing)}`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

export default function DriverMap({ stops = [], fitBoundsOptions, defaultCenter, driverLocation, pickupMarkers = [] }) {
  const sortedStops = useMemo(() => (
    (stops || [])
      .slice()
      .filter(s => s && typeof s.lat === 'number' && typeof s.lng === 'number')
      .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0))
  ), [stops]);

  const positions = useMemo(() => sortedStops.map(s => [s.lat, s.lng]), [sortedStops]);

  // If driverLocation is provided, add it to positions so bounds fit it too
  const boundsPositions = useMemo(() => {
    let pos = [...positions];
    if (driverLocation) {
      pos.push([driverLocation.lat, driverLocation.lng]);
    }
    if (pickupMarkers && pickupMarkers.length > 0) {
      pickupMarkers.forEach(m => pos.push([m.lat, m.lng]));
    }
    return pos;
  }, [positions, driverLocation, pickupMarkers]);

  if (!sortedStops.length && !defaultCenter && !driverLocation) {
    return <div className="map-empty" style={{height: '100vh', width: '100vw', background: '#0f172a'}}></div>;
  }

  const center = driverLocation ? [driverLocation.lat, driverLocation.lng] : (positions.length > 0 ? positions[0] : defaultCenter);

  return (
    <div className="driver-map" style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', zIndex: 0 }}>
      <MapContainer center={center} zoom={14} scrollWheelZoom={true} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sortedStops.map((s) => {
          return (
            <Marker key={s.id || s.stopOrder} position={[s.lat, s.lng]} icon={getMarkerIcon(s.type)}>
              <Popup>
                {s.type === 'PICKUP' ? 'Pickup' : 'Dropoff'} (Stop {s.stopOrder})
              </Popup>
            </Marker>
          );
        })}

        {pickupMarkers.map((m, i) => (
          <Marker key={m.id || i} position={[m.lat, m.lng]} icon={getMarkerIcon('PICKUP')}>
            <Popup>Trip Request Pickup</Popup>
          </Marker>
        ))}

        {positions.length > 0 && (
          <Polyline positions={positions} pathOptions={{ color: '#000000', weight: 4, dashArray: '10, 10' }} />
        )}

        {driverLocation && (
          <Marker 
            position={[driverLocation.lat, driverLocation.lng]} 
            icon={getCarIcon(driverLocation.bearing || 0)} 
            zIndexOffset={1000}
          />
        )}

        <FitBounds positions={boundsPositions} fitBoundsOptions={fitBoundsOptions} />
      </MapContainer>
    </div>
  );
}
