import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getRideRequests } from '../api/rideRequests';

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
        const requests = await getRideRequests(userId);
        if (!mounted) return;

        const updated = requests.find(r => r.id === rideRequestId);
        if (updated && updated.status !== state.rideRequest?.status) {
          dispatch({ type: 'SET_RIDE_REQUEST', payload: updated });
        }
      } catch (err) {
        // Keep polling resilient; surface errors to console only
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
    state.rideRequest?.id,
    dispatch,
  ]);
}