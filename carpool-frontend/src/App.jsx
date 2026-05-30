import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useAppInit } from './hooks/useAppInit';

import UserSelectorScreen from './pages/UserSelectorScreen';
import HomeScreen from './pages/HomeScreen';
import WaitingScreen from './pages/WaitingScreen';
import TripScreen from './pages/TripScreen';
import SummaryScreen from './pages/SummaryScreen';

import StatusBanner from './components/StatusBanner';
import LoadingState from './components/LoadingState';

const STATE_TO_ROUTE = {
  IDLE: '/',
  PENDING: '/waiting',
  MATCHED: '/waiting',
  TRIP_ACTIVE: '/trip',
  TRIP_COMPLETED: '/summary',
  CANCELLED: '/',
};

function getTargetRoute(uiState, tripId) {
  if (uiState === 'TRIP_ACTIVE') {
    return tripId ? `/trip/${tripId}` : '/trip';
  }

  if (uiState === 'TRIP_COMPLETED') {
    return tripId ? `/summary/${tripId}` : '/summary';
  }

  return STATE_TO_ROUTE[uiState] || '/';
}

export default function App() {
  const { state } = useApp();
  const navigate = useNavigate();

  useAppInit();

  const userId = (state.user && state.user.id) || state.userId;
  const targetRoute = getTargetRoute(state.uiState, state.trip?.id);

  // 🔥 Lifecycle-driven navigation after hydration completes
  useEffect(() => {
    if (!userId) return;
    if (state.loading.init) return;

    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    }
  }, [userId, state.loading.init, state.uiState, state.trip?.id, targetRoute, navigate]);

  // No user selected
  if (!userId) {
    return <UserSelectorScreen />;
  }

  // Initial loading / hydration
  if (state.loading.init) {
    return <LoadingState message="Loading your session..." />;
  }

  return (
    <>
      <StatusBanner />

      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/waiting" element={<WaitingScreen />} />
        <Route path="/trip/:tripId?" element={<TripScreen />} />
        <Route path="/summary/:tripId?" element={<SummaryScreen />} />

        <Route path="*" element={<Navigate to={targetRoute} replace />} />
      </Routes>
    </>
  );
}