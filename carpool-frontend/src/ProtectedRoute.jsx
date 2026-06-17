import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { getRouteForUiState, isRouteValidForUiState, ROUTES } from './utils/routeUtils';

export default function ProtectedRoute({ children }) {
  const { state } = useApp();
  const { isAuthenticated, isVerified, loading: authLoading } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  if (state.loading.init || authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    if (pathname === ROUTES.ADMIN) {
      return children;
    }
    // Save intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (isRouteValidForUiState(pathname, state)) {
    return children;
  }

  return <Navigate to={getRouteForUiState(state.uiState, state.trip?.id)} replace />;
}
