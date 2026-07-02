import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5050';

// Helper to calculate distance between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

// Helper to calculate bearing between two coordinates
function getBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const bearingRad = Math.atan2(y, x);
  return (bearingRad * 180) / Math.PI;
}

export function useGPSSimulator(tripId, tripStops, isStarted) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const socketRef = useRef(null);
  
  useEffect(() => {
    if (!tripId || !tripStops || tripStops.length === 0 || !isStarted) return;

    // 1. Setup Socket
    const token = localStorage.getItem('accessToken');
    const socket = io(BACKEND_URL, {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      socket.emit('joinTrip', { tripId });
    });

    // 2. Setup Simulator
    // We'll simulate driving linearly between the stops.
    // We start at stop 0.
    let currentStopIndex = 0;
    let simulatedLat = tripStops[0].lat;
    let simulatedLng = tripStops[0].lng;
    
    // speed: ~50 km/h = 13.8 m/s. We update every 1s
    const SPEED_M_PER_S = 30; // sped up slightly for demo

    setCurrentLocation({ lat: simulatedLat, lng: simulatedLng, bearing: 0 });

    const interval = setInterval(() => {
      if (currentStopIndex >= tripStops.length - 1) {
        clearInterval(interval);
        return;
      }

      const nextStop = tripStops[currentStopIndex + 1];
      const distToNext = getDistance(simulatedLat, simulatedLng, nextStop.lat, nextStop.lng);

      let bearing = getBearing(simulatedLat, simulatedLng, nextStop.lat, nextStop.lng);

      if (distToNext <= SPEED_M_PER_S) {
        // We reached the next stop
        simulatedLat = nextStop.lat;
        simulatedLng = nextStop.lng;
        currentStopIndex++;
      } else {
        // Move towards the next stop
        const ratio = SPEED_M_PER_S / distToNext;
        simulatedLat = simulatedLat + (nextStop.lat - simulatedLat) * ratio;
        simulatedLng = simulatedLng + (nextStop.lng - simulatedLng) * ratio;
      }

      setCurrentLocation({ lat: simulatedLat, lng: simulatedLng, bearing, speed: SPEED_M_PER_S });

      // Emit to server
      socket.emit('driverLocationUpdate', {
        tripId,
        lat: simulatedLat,
        lng: simulatedLng,
        bearing
      });

    }, 1000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [tripId, tripStops, isStarted]);

  return currentLocation;
}
