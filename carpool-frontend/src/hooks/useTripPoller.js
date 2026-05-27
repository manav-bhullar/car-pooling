import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getTrips } from '../api/trips';
import { findUserTrip } from '../utils/stateUtils';

export function useTripPoller() {
  const { state, dispatch } = useApp();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!state.trip) return;

    function poll() {
      getTrips(state.userId).then(trips => {
        const updatedTrip = findUserTrip(trips, state.userId);
        if (updatedTrip && updatedTrip.status !== state.trip.status) {
          dispatch({ type: 'SET_TRIP', payload: updatedTrip });
        }
      }).catch(err => {
        console.error('Trip polling failed:', err);
      });
    }

    intervalRef.current = setInterval(poll, 2000); // poll every 2 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.trip, state.userId, dispatch]);
}