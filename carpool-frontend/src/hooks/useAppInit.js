import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentRideRequest } from '../api/rideRequests';
import { getCurrentTrip } from '../api/trips';

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
        // Fetch only the current lifecycle state from backend
        const [rideRequest, trip] = await Promise.all([
          getCurrentRideRequest(userId),
          getCurrentTrip(userId),
        ]);

        if (!mounted) return;

        dispatch({ type: 'SET_RIDE_REQUEST', payload: rideRequest });
        dispatch({ type: 'SET_TRIP', payload: trip });
        dispatch({ type: 'INIT_COMPLETE', payload: { rideRequest, trip } });
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