import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { apiClient } from "../api/apiClient";

const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5050";

export function useDriverLocation(tripId, isStarted) {
  const [driverLocation, setDriverLocation] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!tripId || !isStarted) return;

    const token = apiClient.accessToken;
    const socket = io(BACKEND_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Rider connected to WebSocket");
      socket.emit("joinTrip", { tripId });
    });

    socket.on("driverLocation", (data) => {
      setDriverLocation({
        lat: data.lat,
        lng: data.lng,
        bearing: data.bearing,
        timestamp: data.timestamp,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [tripId, isStarted]);

  return driverLocation;
}
