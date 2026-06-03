import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { getRouteForUiState, isRouteValidForUiState, ROUTES } from './utils/routeUtils';

export default function ProtectedRoute({ children }) {
  const { state } = useApp();
  const location = useLocation();
  const pathname = location.pathname;

  if (state.loading.init) {
    return null;
  }

  const userId = (state.user && state.user.id) || state.userId;

  if (!userId) {
    if (pathname === ROUTES.ROOT || pathname === ROUTES.ADMIN) {
      return children;
    }
    return <Navigate to={ROUTES.ROOT} replace />;
  }

  if (isRouteValidForUiState(pathname, state)) {
    return children;
  }

  return <Navigate to={getRouteForUiState(state.uiState, state.trip?.id)} replace />;
}
