import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5050';

/**
 * Socket hook for the driver client.
 * Listens for `trip_cancelled` events and redirects the driver
 * back to the dashboard with an alert when their active trip is cancelled.
 */
export function useTripSocket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(BACKEND_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Driver socket connected for trip notifications');
    });

    socket.on('trip_cancelled', (data) => {
      console.log('Trip cancelled event received:', data);
      alert(data.reason || 'Your trip has been cancelled.');
      navigate('/');
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, navigate]);

  return socketRef;
}
