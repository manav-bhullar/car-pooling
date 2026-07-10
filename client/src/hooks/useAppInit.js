import { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { getCurrentRideRequest } from "../api/rideRequests";
import { getCurrentTrip } from "../api/trips";

export function useAppInit() {
  const { state, dispatch } = useApp();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't initialize app state until auth is resolved
    if (authLoading) return;

    // If there is no authenticated user, complete initialization immediately
    if (!isAuthenticated) {
      if (state.loading.init) {
        dispatch({
          type: "INIT_COMPLETE",
          payload: { rideRequest: null, trip: null },
        });
      }
      return;
    }

    // Only run while init flag is true
    if (!state.loading.init) return;

    let mounted = true;

    async function init() {
      try {
        // Fetch only the current lifecycle state from backend
        // Note: userId is no longer needed in the request body/headers since it's in the JWT
        const [rideRequest, trip] = await Promise.all([
          getCurrentRideRequest(),
          getCurrentTrip(user.id),
        ]);

        if (!mounted) return;

        dispatch({ type: "SET_RIDE_REQUEST", payload: rideRequest });
        dispatch({ type: "SET_TRIP", payload: trip });
        dispatch({ type: "INIT_COMPLETE", payload: { rideRequest, trip } });
      } catch (err) {
        console.error("Init failed:", err);

        // Fail-safe → don’t block UI, normalize to empty source state
        dispatch({ type: "SET_RIDE_REQUEST", payload: null });
        dispatch({ type: "SET_TRIP", payload: null });
        dispatch({
          type: "INIT_COMPLETE",
          payload: { rideRequest: null, trip: null },
        });
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authLoading, user?.id, state.loading.init, dispatch]);
}
