import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentRideRequest } from '../api/rideRequests';
import { getCurrentTrip } from '../api/trips';

// Poll ride requests only when UI lifecycle is PENDING or MATCHED.
export function useRideRequestPoller() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const intervalRef = useRef(null);

  const userId = user?.id;
  const uiState = state.uiState;

  useEffect(() => {
    // Guard: do not start polling without an authenticated user
    if (!userId) return;

    // Activate only during PENDING or MATCHED lifecycle states
    if (uiState !== 'PENDING' && uiState !== 'MATCHED') return;

    let mounted = true;

    async function poll() {
      try {
        const updated = await getCurrentRideRequest(userId);
        if (!mounted) return;

        if (!updated && state.rideRequest) {
          dispatch({ type: 'SET_RIDE_REQUEST', payload: null });
          return;
        }

        if (updated && JSON.stringify(updated) !== JSON.stringify(state.rideRequest)) {
          dispatch({ type: 'SET_RIDE_REQUEST', payload: updated });
        }

        if (uiState === 'MATCHED' && !state.trip) {
          const currentTrip = await getCurrentTrip(userId);
          if (!mounted) return;
          if (currentTrip) {
            dispatch({ type: 'SET_TRIP', payload: currentTrip });
          }
        }
      } catch (err) {
        console.error('RideRequest poll failed:', err);
      }
    }

    // Run one immediate poll then start stable interval
    poll();
    // Slightly faster polling to surface ride request state changes quickly.
    intervalRef.current = setInterval(poll, 5000);

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
    state.rideRequest,
    state.trip,
    dispatch,
  ]);
}