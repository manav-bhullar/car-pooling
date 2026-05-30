import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getRideRequests } from '../api/rideRequests';
import { getTrips } from '../api/trips';
import { findUserTrip } from '../utils/stateUtils';

export function useAppInit() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const userId = (state.user && state.user.id) || state.userId;
    if (!userId) return;
    if (!state.loading.init) return;

    async function init() {
      try {
        // 1. Fetch all ride requests of user
        const requests = await getRideRequests(userId);

        // 2. Find active request
        const active = requests.find(r =>
          r.status === 'PENDING' || r.status === 'MATCHED'
        );

        // No active request → IDLE
        if (!active) {
          dispatch({
            type: 'INIT_COMPLETE',
            payload: { rideRequest: null, trip: null },
          });
          return;
        }

        // If still waiting
        if (active.status === 'PENDING') {
          dispatch({
            type: 'INIT_COMPLETE',
            payload: { rideRequest: active, trip: null },
          });
          return;
        }

        // If matched → need trip
        if (active.status === 'MATCHED') {
          const trips = await getTrips(userId);

          const trip = findUserTrip(trips, userId);

          dispatch({
            type: 'INIT_COMPLETE',
            payload: { rideRequest: active, trip },
          });

          return;
        }

      } catch (err) {
        console.error('Init failed:', err);

        // Fail-safe → don’t block UI
        dispatch({
          type: 'INIT_COMPLETE',
          payload: { rideRequest: null, trip: null },
        });
      }
    }

    init();
  }, [
    (state.user && state.user.id) || state.userId,
    state.loading.init,
    dispatch,
  ]);
}