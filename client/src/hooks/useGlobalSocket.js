import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/apiClient';

const BACKEND_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5050';

export function useGlobalSocket() {
  const { user } = useAuth();
  const { dispatch } = useApp();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const token = apiClient.accessToken;
    const socket = io(BACKEND_URL, {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Global socket connected for user notifications');
    });

    socket.on('ride_cancelled', (data) => {
      console.log('Ride cancelled event received:', data);
      dispatch({ type: 'SET_RIDE_REQUEST', payload: null });
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: {
          type: 'warning',
          message: data.reason || 'Your ride was cancelled.'
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, dispatch]);
}
