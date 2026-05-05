import { createContext, useContext, useReducer } from 'react';
import { deriveUIState } from '../utils/stateUtils';

const AppContext = createContext(null);

const initialState = {
  userId: null,
  userName: null,

  rideRequest: null,
  trip: null,

  uiState: 'IDLE',

  notification: null,
  isInitializing: true,
};

function reducer(state, action) {
  switch (action.type) {

    case 'SELECT_USER': {
      return {
        ...initialState,
        userId: action.payload.id,
        userName: action.payload.name,
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
      const trip = action.payload;

      return {
        ...state,
        trip,
        uiState: deriveUIState(state.rideRequest, trip),
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
        userId: state.userId,
        userName: state.userName,
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

export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }

  return ctx;
}