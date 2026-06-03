import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentTrip } from '../api/trips';

// Poll trips while the app may need the current active trip.
// This includes TRIP_ACTIVE and MATCHED when a trip has not yet been hydrated.
export function useTripPoller() {
  const { state, dispatch } = useApp();
  const intervalRef = useRef(null);

  useEffect(() => {
    const userId = (state.user && state.user.id) || state.userId;
    const uiState = state.uiState;
    const tripId = state.trip?.id || null;

    // Guard: do not start polling without an authenticated user
    if (!userId) return;

    const shouldPollTrip = uiState === 'TRIP_ACTIVE' || (uiState === 'MATCHED' && !tripId);
    if (!shouldPollTrip) return;

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
    state.trip,
    dispatch,
  ]);
}