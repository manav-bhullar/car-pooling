import { useApp } from '../context/AppContext';
import { useTripPoller } from '../hooks/useTripPoller';
import { completeTrip } from '../api/trips';
import { cancelRideRequest } from '../api/rideRequests';
import TripCard from '../components/TripCard';
import CancelButton from '../components/CancelButton';

export default function TripScreen() {
  const { state, dispatch } = useApp();

  useTripPoller();

  async function handleComplete() {
    try {
      await completeTrip(state.userId, state.trip.id);
      const updatedTrip = { ...state.trip, status: 'COMPLETED' };
      dispatch({ type: 'SET_TRIP', payload: updatedTrip });
    } catch (err) {
      if (err.status === 400) {
        // trip was cancelled underneath us
        dispatch({
          type: 'SET_NOTIFICATION',
          payload: { type: 'warning', message: 'Trip could not be completed. It may have been cancelled.' }
        });
      } else {
        dispatch({
          type: 'SET_NOTIFICATION',
          payload: { type: 'error', message: 'Failed to complete trip. Please try again.' }
        });
      }
    }
  }

  async function handleCancel() {
    try {
      await cancelRideRequest(state.userId, state.rideRequest.id);
      dispatch({ type: 'RESET' });
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { type: 'info', message: 'Trip cancelled. Co-riders have been notified.' }
      });
    } catch {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { type: 'error', message: 'Failed to cancel. Please try again.' }
      });
    }
  }

  if (!state.trip) {
    return (
      <div className="trip-screen">
        <p className="trip-finalizing">Finalizing your trip...</p>
      </div>
    );
  }

  return (
    <div className="trip-screen">
      <TripCard trip={state.trip} currentUserId={state.userId} />
      <button
        className="complete-button"
        onClick={handleComplete}
      >
        Mark trip as done
      </button>
      <p className="complete-hint">Tap when you have reached your destination</p>
      <CancelButton onCancel={handleCancel} label="Cancel trip" />
    </div>
  );
}