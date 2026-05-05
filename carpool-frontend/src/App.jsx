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
  MATCHED: '/trip',
  COMPLETED: '/summary',
};

export default function App() {
  const { state } = useApp();
  const navigate = useNavigate();

  useAppInit();

  // 🔥 This is the brain of navigation
  useEffect(() => {
    if (!state.userId) return;
    if (state.isInitializing) return;

    const targetRoute = STATE_TO_ROUTE[state.uiState];

    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    }
  }, [state.uiState, state.isInitializing, state.userId]);

  // No user selected
  if (!state.userId) {
    return <UserSelectorScreen />;
  }

  // Initial loading
  if (state.isInitializing) {
    return <LoadingState message="Loading your session..." />;
  }

  return (
    <>
      <StatusBanner />

      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/waiting" element={<WaitingScreen />} />
        <Route path="/trip" element={<TripScreen />} />
        <Route path="/summary" element={<SummaryScreen />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}