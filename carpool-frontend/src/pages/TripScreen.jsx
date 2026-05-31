import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTripPoller } from '../hooks/useTripPoller';
import { completeTrip, getTripById } from '../api/trips';
import { cancelRideRequest } from '../api/rideRequests';
import TripCard from '../components/TripCard';
import CancelButton from '../components/CancelButton';

export default function TripScreen() {
  const { state, dispatch } = useApp();

  useTripPoller();

  async function handleComplete() {
    // Confirm because completing a trip will finalize it for all riders
    if (!window.confirm('Completing this trip will finalize it for all riders. Are you sure?')) return;

    try {
      await completeTrip(state.userId, state.trip.id);
      const updatedTrip = { ...state.trip, status: 'COMPLETED' };
      dispatch({ type: 'SET_TRIP', payload: updatedTrip });
    } catch (err) {
      if (err.status === 400) {
        // trip was cancelled or not completable underneath us
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

  // If a tripId is present in the URL (refresh/bookmark), fetch that trip explicitly
  const { tripId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function fetchTrip() {
      if (!tripId) return;
      const userId = (state.user && state.user.id) || state.userId;
      try {
        const trip = await getTripById(userId, tripId);
        if (!mounted) return;
        dispatch({ type: 'SET_TRIP', payload: trip });
      } catch (err) {
        // unauthorized or missing trip → reset and go home
        dispatch({ type: 'RESET' });
        navigate('/', { replace: true });
      }
    }

    fetchTrip();
    return () => { mounted = false; };
  }, [tripId, state.user, state.userId, dispatch, navigate]);

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