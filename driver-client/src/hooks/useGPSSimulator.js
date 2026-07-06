import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5050';

export function useGPSSimulator(tripId, tripStops, isStarted) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const socketRef = useRef(null);
  const lastLocationRef = useRef(null);
  
  useEffect(() => {
    if (!tripId || !isStarted) return;

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

    // 2. Real GPS Tracking (using device location)
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading, speed } = pos.coords;
          
          // Calculate heading if not provided by device (e.g., some desktops/browsers)
          let bearing = heading || 0;
          if (heading === null && lastLocationRef.current) {
             const prev = lastLocationRef.current;
             if (prev.lat !== latitude || prev.lng !== longitude) {
                // simple bearing calculation for fallback
                const y = Math.sin((longitude - prev.lng) * Math.PI / 180) * Math.cos(latitude * Math.PI / 180);
                const x = Math.cos(prev.lat * Math.PI / 180) * Math.sin(latitude * Math.PI / 180) -
                          Math.sin(prev.lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * Math.cos((longitude - prev.lng) * Math.PI / 180);
                bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
             } else {
                bearing = prev.bearing; // preserve previous bearing if not moved
             }
          }

          const loc = { 
            lat: latitude, 
            lng: longitude, 
            bearing: bearing,
            speed: speed || 0
          };
          
          lastLocationRef.current = loc;
          setCurrentLocation(loc);

          // Emit to server
          socket.emit('driverLocationUpdate', {
            tripId,
            lat: latitude,
            lng: longitude,
            bearing: bearing
          });
        },
        (err) => {
          console.error('GPS Error:', err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [tripId, isStarted]);

  return currentLocation;
}
