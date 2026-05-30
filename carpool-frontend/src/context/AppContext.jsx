import { createContext, useContext, useReducer } from 'react';
import { deriveUIState } from '../utils/stateUtils';

const AppContext = createContext(null);

const initialState = {
  // Canonical source state
  user: null, // { id, name, email }
  rideRequest: null,
  trip: null,

  // Derived (kept for backward compatibility until next pass)
  uiState: 'IDLE',

  // Loading / error buckets required by canonical shape
  loading: {
    init: true,
    submitting: false,
    cancelling: false,
    completing: false,
  },
  error: null,

  // Backwards-compatible fields (deprecated)
  userId: null,
  userName: null,
  notification: null,
  isInitializing: true,
};

function reducer(state, action) {
  switch (action.type) {

    case 'SELECT_USER': {
      const user = {
        id: action.payload.id,
        name: action.payload.name,
        email: action.payload.email || null,
      };

      return {
        ...initialState,
        user,
        // keep backwards compatibility
        userId: user.id,
        userName: user.name,
        loading: { ...initialState.loading, init: false },
        isInitializing: false,
      };
    }

    case 'INIT_COMPLETE': {
      const { rideRequest, trip } = action.payload;

      return {
        ...state,
        rideRequest: rideRequest || null,
        trip: trip || null,
        uiState: deriveUIState(rideRequest, trip),
        loading: { ...state.loading, init: false },
        isInitializing: false,
      };
    }

    case 'SET_RIDE_REQUEST': {
      const rideRequest = action.payload;

      return {
        ...state,
        rideRequest,
        uiState: deriveUIState(rideRequest, state.trip),
      };
    }

    case 'SET_TRIP': {
      const rideRequest = state.rideRequest;
      const trip = action.payload;
      const derived = deriveUIState(rideRequest, trip);

      // co-rider cancelled — clear trip, go back to PENDING
      if (derived === 'REQUEUED') {
        return {
          ...state,
          trip: null,
          uiState: 'PENDING',
        };
      }

      return {
        ...state,
        trip,
        uiState: derived,
      };
    }

    case 'SET_NOTIFICATION': {
      return {
        ...state,
        notification: action.payload,
      };
    }

    case 'CLEAR_NOTIFICATION': {
      return {
        ...state,
        notification: null,
      };
    }

    case 'RESET': {
      return {
        ...initialState,
        // preserve current user for session continuity
        user: state.user || null,
        userId: state.userId,
        userName: state.userName,
        loading: { ...initialState.loading, init: false },
        isInitializing: false,
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }

  return ctx;
}