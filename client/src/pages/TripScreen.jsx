import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { completeTrip } from '../api/trips';
import { cancelRideRequest } from '../api/rideRequests';
import TripMap from '../components/TripMap';
import CancelModal from '../components/CancelModal';
import PassengerList from '../components/PassengerList';
import './TripScreen.css';

export default function TripScreen() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);

  async function handleComplete() {
    if (!window.confirm('Completing this trip will finalize it for all riders. Are you sure?')) return;

    try {
      const data = await completeTrip(user?.id, state.trip.id);
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
      await cancelRideRequest(user?.id, state.rideRequest?.id || state.trip?.rideRequestId);
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
      <div className="trip-screen-loading">
        <div className="loading-spinner"></div>
        <p>Finalizing your trip...</p>
      </div>
    );
  }

  const trip = state.trip;
  const me = (trip.passengers || []).find(p => p.userId === user?.id) || {};
  
  const displayDistance = typeof me.distanceKm === 'number' && me.distanceKm > 0
    ? me.distanceKm
    : trip.totalDistanceKm;

  const displayEtaMinutes = typeof me.etaMinutes === 'number' && me.etaMinutes >= 0
    ? me.etaMinutes
    : trip.estimatedEtaMinutes;

  // Status chip styles based on M3 Expressive states
  let statusClass = "trip-status-chip--pending";
  if (["RIDERS_MATCHED", "DRIVER_MATCHED", "STARTED"].includes(trip.status)) statusClass = "trip-status-chip--active";
  if (trip.status === "COMPLETED") statusClass = "trip-status-chip--done";

  return (
    <div className="trip-screen-expressive">
      {/* Top 55% Full-Bleed Map */}
      <div className="trip-map-container">
        <TripMap stops={trip.stops} myRideRequestId={me.rideRequestId} />
      </div>

      {/* Persistent Bottom Sheet */}
      <div className="trip-bottom-sheet">
        {/* Blur shape behind content */}
        <div className="blur-shape trip-sheet-blur"></div>
        
        <div className="trip-sheet-content">
          <div className="trip-sheet-header">
            <div className={`trip-status-chip ${statusClass}`}>
              {trip.status}
            </div>
            <h2 className="trip-headline">En route to destination</h2>
          </div>

          <div className="trip-eta-block">
            <span className="trip-eta-value">{displayEtaMinutes}</span>
            <span className="trip-eta-label">min</span>
          </div>

          <div className="trip-driver-card glass-card">
            <h3>Your Fare: ${me.fareShare?.toFixed(2)}</h3>
            <p>Total Distance: {displayDistance?.toFixed(2)} km</p>
          </div>

          <div className="trip-passengers">
            <h3>Co-riders</h3>
            <PassengerList passengers={trip.passengers} currentUserId={user?.id} />
          </div>

          <div className="trip-actions-row">
            <button className="btn btn-primary" onClick={handleComplete}>Complete Trip</button>
            <button className="btn btn-danger" onClick={() => setShowCancelModal(true)}>Cancel</button>
          </div>
        </div>
      </div>

      <CancelModal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} onConfirm={confirmCancel} />
    </div>
  );
}