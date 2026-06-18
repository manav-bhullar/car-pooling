export const ROUTES = {
  ROOT: '/',
  HOME: '/home',
  WAITING: '/waiting',
  TRIP_BASE: '/trip',
  SUMMARY_BASE: '/summary',
  ADMIN: '/admin',
};

const ALLOWED_UI_STATES = {
  [ROUTES.HOME]: ['IDLE', 'CANCELLED'],
  [ROUTES.WAITING]: ['PENDING'],
  [ROUTES.TRIP_BASE]: ['MATCHED', 'TRIP_ACTIVE'],
  [ROUTES.SUMMARY_BASE]: ['TRIP_COMPLETED'],
  [ROUTES.ADMIN]: null,
  [ROUTES.ROOT]: null,
};

export function getRouteForUiState(uiState, tripId) {
  switch (uiState) {
    case 'IDLE':
    case 'CANCELLED':
      return ROUTES.HOME;
    case 'PENDING':
      return ROUTES.WAITING;
    case 'MATCHED':
    case 'TRIP_ACTIVE':
      return tripId ? `${ROUTES.TRIP_BASE}/${tripId}` : ROUTES.TRIP_BASE;
    case 'TRIP_COMPLETED':
      return tripId ? `${ROUTES.SUMMARY_BASE}/${tripId}` : ROUTES.SUMMARY_BASE;
    default:
      return ROUTES.HOME;
  }
}

export function getRouteKey(pathname) {
  if (pathname === ROUTES.ROOT) return ROUTES.ROOT;
  if (pathname === ROUTES.HOME) return ROUTES.HOME;
  if (pathname === ROUTES.WAITING) return ROUTES.WAITING;
  if (pathname === ROUTES.ADMIN) return ROUTES.ADMIN;
  if (pathname.startsWith(`${ROUTES.TRIP_BASE}/`) || pathname === ROUTES.TRIP_BASE) {
    return ROUTES.TRIP_BASE;
  }
  if (pathname.startsWith(`${ROUTES.SUMMARY_BASE}/`)) {
    return ROUTES.SUMMARY_BASE;
  }
  return null;
}

function isTripRouteMatch(pathname, tripId) {
  return pathname === `${ROUTES.TRIP_BASE}/${tripId}`;
}

function isSummaryRouteMatch(pathname, tripId) {
  return pathname === `${ROUTES.SUMMARY_BASE}/${tripId}`;
}

export function isRouteValidForUiState(pathname, state) {
  const routeKey = getRouteKey(pathname);
  if (!routeKey) return false;

  if (routeKey === ROUTES.ADMIN) {
    return true;
  }

  if (routeKey === ROUTES.ROOT) {
    return !state.user && !state.userId;
  }

  const allowedStates = ALLOWED_UI_STATES[routeKey];
  if (!allowedStates || !allowedStates.includes(state.uiState)) {
    return false;
  }

  if (routeKey === ROUTES.TRIP_BASE && state.trip?.id) {
    return isTripRouteMatch(pathname, state.trip.id);
  }

  if (routeKey === ROUTES.TRIP_BASE && !state.trip?.id) {
    return state.uiState === 'MATCHED';
  }

  if (routeKey === ROUTES.SUMMARY_BASE) {
    return state.trip?.id ? isSummaryRouteMatch(pathname, state.trip.id) : false;
  }

  return true;
}
