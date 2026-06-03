import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getRideRequests } from '../api/rideRequests';
import { getTrips } from '../api/trips';
import { findUserTrip } from '../utils/stateUtils';

export function useAppInit() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const userId = (state.user && state.user.id) || state.userId;

    // If there is no user, we still need to complete initialization so
    // the app can show the user selector instead of remaining stuck on loading.
    if (!userId && state.loading.init) {
      dispatch({ type: 'INIT_COMPLETE', payload: { rideRequest: null, trip: null } });
      return;
    }

    // Only run while init flag is true
    if (!state.loading.init) return;

    if (!userId) return;

    let mounted = true;

    async function init() {
      try {
        // Fetch both source endpoints in parallel (backend is source of truth)
        const [requests, trips] = await Promise.all([
          getRideRequests(userId),
          getTrips(userId),
        ]);

        if (!mounted) return;

        // Determine active rideRequest (PENDING or MATCHED)
        const active = (requests || []).find(r => r.status === 'PENDING' || r.status === 'MATCHED') || null;

        // Find user trip if available
        const trip = findUserTrip(trips || [], userId) || null;

        // Store backend source facts first (no routing yet)
        dispatch({ type: 'SET_RIDE_REQUEST', payload: active });
        dispatch({ type: 'SET_TRIP', payload: trip });

        // Finally, complete initialization — reducer will derive uiState and clear init flag
        dispatch({ type: 'INIT_COMPLETE', payload: { rideRequest: active, trip } });
      } catch (err) {
        console.error('Init failed:', err);

        // Fail-safe → don’t block UI, normalize to empty source state
        dispatch({ type: 'SET_RIDE_REQUEST', payload: null });
        dispatch({ type: 'SET_TRIP', payload: null });
        dispatch({ type: 'INIT_COMPLETE', payload: { rideRequest: null, trip: null } });
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [
    (state.user && state.user.id) || state.userId,
    state.loading.init,
    dispatch,
  ]);
}