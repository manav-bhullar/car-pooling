import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentRideRequest } from '../api/rideRequests';

// Poll ride requests only when UI lifecycle is PENDING or MATCHED.
export function useRideRequestPoller() {
  const { state, dispatch } = useApp();
  const intervalRef = useRef(null);

  useEffect(() => {
    const userId = (state.user && state.user.id) || state.userId;
    const uiState = state.uiState;
    const rideRequestId = state.rideRequest?.id || null;

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
      } catch (err) {
        console.error('RideRequest poll failed:', err);
      }
    }

    // Run one immediate poll then start stable interval
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
    state.rideRequest,
    dispatch,
  ]);
}