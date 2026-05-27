import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getRideRequests } from '../api/rideRequests';

export function useRideRequestPoller() {
  const { state, dispatch } = useApp();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!state.rideRequest || state.rideRequest.status !== 'PENDING') return;

    function poll() {
      getRideRequests(state.userId).then(requests => {
        const updated = requests.find(r => r.id === state.rideRequest.id);
        if (updated && updated.status !== state.rideRequest.status) {
          dispatch({ type: 'SET_RIDE_REQUEST', payload: updated });
        }
      }).catch(err => {
        console.error('Polling failed:', err);
      });
    }

    intervalRef.current = setInterval(poll, 2000); // poll every 2 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.rideRequest, state.userId, dispatch]);
}