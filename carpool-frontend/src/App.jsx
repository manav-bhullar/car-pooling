import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useAppInit } from './hooks/useAppInit';
import { getTrips } from './api/trips';
import { findUserTrip } from './utils/stateUtils';
import { getRouteForUiState } from './utils/routeUtils';
import ProtectedRoute from './ProtectedRoute';

import UserSelectorScreen from './pages/UserSelectorScreen';
import HomeScreen from './pages/HomeScreen';
import WaitingScreen from './pages/WaitingScreen';
import TripScreen from './pages/TripScreen';
import SummaryScreen from './pages/SummaryScreen';

import StatusBanner from './components/StatusBanner';
import LoadingState from './components/LoadingState';

export default function App() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  useAppInit();

  const userId = (state.user && state.user.id) || state.userId;
  const targetRoute = userId ? getRouteForUiState(state.uiState, state.trip?.id) : '/';

  useEffect(() => {
    if (!userId) return;
    if (state.loading.init) return;
    if (state.trip) return;
    if (state.uiState !== 'MATCHED') return;

    getTrips(userId)
      .then((trips) => {
        const userTrip = findUserTrip(trips, userId);
        if (userTrip) {
          dispatch({ type: 'SET_TRIP', payload: userTrip });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch trip after MATCHED:', err);
      });
  }, [state.uiState, state.trip, state.loading.init, userId, dispatch]);

  // 🔥 Lifecycle-driven navigation after hydration completes
  useEffect(() => {
    if (!userId) return;
    if (state.loading.init) return;

    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    }
  }, [userId, state.loading.init, state.uiState, state.trip?.id, targetRoute, navigate]);

  // Initial loading / hydration
  if (state.loading.init) {
    return <LoadingState message="Loading your session..." />;
  }

  return (
    <>
      <StatusBanner />

      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <UserSelectorScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiting"
          element={
            <ProtectedRoute>
              <WaitingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip/:tripId?"
          element={
            <ProtectedRoute>
              <TripScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary/:tripId"
          element={
            <ProtectedRoute>
              <SummaryScreen />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={targetRoute} replace />} />
      </Routes>
    </>
  );
}
