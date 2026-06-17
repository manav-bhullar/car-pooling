import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentTrip } from '../api/trips';

// Poll trips only when UI lifecycle is TRIP_ACTIVE.
export function useTripPoller() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const intervalRef = useRef(null);

  const userId = user?.id;
  const uiState = state.uiState;

  useEffect(() => {
    // Guard: do not start polling without an authenticated user
    if (!userId) return;

    // Activate only during TRIP_ACTIVE lifecycle state
    if (uiState !== 'TRIP_ACTIVE') return;

    let mounted = true;

    async function poll() {
      try {
        const updatedTrip = await getCurrentTrip(userId);
        if (!mounted) return;

        if (!updatedTrip && state.trip) {
          dispatch({ type: 'SET_TRIP', payload: null });
          return;
        }

        if (updatedTrip && JSON.stringify(updatedTrip) !== JSON.stringify(state.trip)) {
          dispatch({ type: 'SET_TRIP', payload: updatedTrip });
        }
      } catch (err) {
        console.error('Trip poll failed:', err);
      }
    }

    // Immediate poll before setting interval
    poll();
    // Poll more frequently to detect remote cancellations quicker.
    intervalRef.current = setInterval(poll, 10000);

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // Depend on primitives only to avoid unnecessary interval recreation
  }, [
    userId,
    uiState,
    state.trip,
    dispatch,
  ]);
}