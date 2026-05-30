import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getTrips } from '../api/trips';
import { findUserTrip } from '../utils/stateUtils';

// Poll trips only when UI lifecycle is TRIP_ACTIVE.
export function useTripPoller() {
  const { state, dispatch } = useApp();
  const intervalRef = useRef(null);

  useEffect(() => {
    const userId = (state.user && state.user.id) || state.userId;
    const uiState = state.uiState;
    const tripId = state.trip?.id || null;

    // Guard: do not start polling without an authenticated user
    if (!userId) return;

    // Activate only during TRIP_ACTIVE lifecycle
    if (uiState !== 'TRIP_ACTIVE') return;

    let mounted = true;

    async function poll() {
      try {
        const trips = await getTrips(userId);
        if (!mounted) return;

        const updatedTrip = findUserTrip(trips, userId);
        if (updatedTrip && updatedTrip.status !== state.trip?.status) {
          dispatch({ type: 'SET_TRIP', payload: updatedTrip });
        }
      } catch (err) {
        console.error('Trip poll failed:', err);
      }
    }

    // Immediate poll before setting interval
    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // Depend on primitives only to avoid unnecessary interval recreation
  }, [
    (state.user && state.user.id) || state.userId,
    state.uiState,
    state.trip?.id,
    dispatch,
  ]);
}