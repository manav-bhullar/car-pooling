import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { completeTrip } from '../api/trips';
import { cancelRideRequest } from '../api/rideRequests';
import TripCard from '../components/TripCard';
import TripMap from '../components/TripMap';
import CancelModal from '../components/CancelModal';
import FareBadge from '../components/FareBadge';
import StopList from '../components/StopList';
import PassengerList from '../components/PassengerList';
import './TripScreen.css';

export default function TripScreen() {
  const { state, dispatch } = useApp();
  const [showCancelModal, setShowCancelModal] = useState(false);

  async function handleComplete() {
    // Confirm because completing a trip will finalize it for all riders
    if (!window.confirm('Completing this trip will finalize it for all riders. Are you sure?')) return;

    try {
      const data = await completeTrip(state.userId, state.trip.id);
      const updatedTrip = { ...state.trip, ...data, status: 'COMPLETED' };
      dispatch({ type: 'SET_TRIP', payload: updatedTrip });
      dispatch({ type: 'SET_UI_STATE', payload: 'TRIP_COMPLETED' });
    } catch (err) {
      if (err.status === 400) {
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

  async function confirmCancel() {
    try {
      await cancelRideRequest(state.userId, state.rideRequest?.id || state.trip?.rideRequestId);
      dispatch({ type: 'RESET' });
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { type: 'info', message: 'Trip cancelled. Co-riders have been returned to the queue.' }
      });
    } catch {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { type: 'error', message: 'Failed to cancel. Please try again.' }
      });
    } finally {
      setShowCancelModal(false);
    }
  }

  if (!state.trip) {
    return (
      <div className="trip-screen">
        <p className="trip-finalizing">Finalizing your trip...</p>
      </div>
    );
  }

  const trip = state.trip;
  const me = (trip.passengers || []).find(p => p.userId === state.userId) || {};

  return (
    <div className="trip-screen two-panel">
      {/* MD3 Organic blur shapes */}
      <div className="trip-blur-shape-1" aria-hidden="true" />
      <div className="trip-blur-shape-2" aria-hidden="true" />

      <div className="left-panel">
        <div className="fare-header">
          <h2>Your fare</h2>
          <FareBadge fareShare={me.fareShare} large />
        </div>

        <div className="trip-metadata">
          <p>Status: {trip.status}</p>
          <p>Total distance: {trip.totalDistanceKm?.toFixed(2)} km</p>
          <p>ETA: {trip.estimatedEtaMinutes} min</p>
        </div>

        <h3>Co-riders</h3>
        <PassengerList passengers={trip.passengers} currentUserId={state.userId} />

        <h3>Stops</h3>
        <StopList stops={trip.stops} />

        <div className="trip-actions">
          <button className="complete-button" onClick={handleComplete}>Complete trip</button>
          <button className="cancel-button" onClick={() => setShowCancelModal(true)}>Cancel trip</button>
        </div>
      </div>

      <div className="right-panel">
        <div className="map-container">
          <TripMap stops={trip.stops} />
        </div>
        <div className="trip-card-compact">
          <TripCard trip={trip} currentUserId={state.userId} />
        </div>
      </div>

      <CancelModal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} onConfirm={confirmCancel} />
    </div>
  );
}