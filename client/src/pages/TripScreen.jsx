import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

import { cancelRideRequest } from '../api/rideRequests';
import TripMap from '../components/TripMap';
import CancelModal from '../components/CancelModal';
import PassengerList from '../components/PassengerList';
import { useDriverLocation } from '../hooks/useDriverLocation';
import './TripScreen.css';

export default function TripScreen() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);



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
  
  const isStarted = trip.status === 'STARTED';
  const driverLocation = useDriverLocation(trip.id, isStarted);
  
  const displayDistance = typeof me.distanceKm === 'number' && me.distanceKm > 0
    ? me.distanceKm
    : trip.totalDistanceKm;

  const displayEtaMinutes = typeof me.etaMinutes === 'number' && me.etaMinutes >= 0
    ? me.etaMinutes
    : trip.estimatedEtaMinutes;

  // Status chip styles based on M3 Expressive states
  let statusClass = "trip-status-chip--pending";
  const soloFare = displayDistance * 12; // Generic solo rate
  const savings = soloFare - (me.fareShare || 0);

  return (
    <div className="trip-screen-expressive">
      {/* Persistent Information Panel (Bottom Sheet on mobile, Left Panel on desktop) */}
      <div className="trip-bottom-sheet">
        <div className="blur-shape trip-sheet-blur"></div>
        
        <div className="trip-sheet-content">
          <div className="trip-sheet-header">
            <div className={`trip-status-chip ${statusClass}`}>
              {trip.status}
            </div>
            <h2 className="trip-headline">Your Shared Trip</h2>
          </div>

          {/* 1 & 2: Fare and ETA (Most Prominent) */}
          <div className="trip-primary-stats glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '24px', background: 'var(--color-md-primary-container)', color: 'var(--color-md-on-primary-container)', borderRadius: '16px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.8, margin: 0, paddingBottom: '4px' }}>Your Fare</p>
              <h2 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700, lineHeight: 1 }}>₹{me.fareShare?.toFixed(0) || '0'}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.8, margin: 0, paddingBottom: '4px' }}>Est. Arrival</p>
              <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 700, lineHeight: 1 }}>{displayEtaMinutes}<span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '4px' }}>min</span></h2>
            </div>
          </div>

          {/* 3: Value Confirmation (Savings) */}
          {savings > 0 && (
             <div className="trip-savings-banner" style={{ background: 'var(--color-md-tertiary-container)', color: 'var(--color-md-on-tertiary-container)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-160h80v-80h-80v80Zm0-120h80v-360h-80v360Z"/></svg>
                You saved ₹{savings.toFixed(0)} vs travelling alone!
             </div>
          )}

          {/* 4: Co-riders */}
          <div className="trip-passengers">
            <PassengerList passengers={trip.passengers} currentUserId={user?.id} />
          </div>

          {/* 5: Route Context */}
          <div className="trip-route-context glass-card" style={{ padding: '16px', borderRadius: '16px', background: 'var(--color-md-surface-container)' }}>
             <h3 style={{ fontSize: '1rem', margin: '0 0 12px 0' }}>Route Summary</h3>
             <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Distance: {displayDistance?.toFixed(2)} km</p>
             <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Detour Ratio: ~{(displayDistance > 0 ? (trip.totalDistanceKm / displayDistance - 1) * 100 : 0).toFixed(0)}% added</p>
          </div>

          <div className="trip-actions-row">
            <button className="btn btn-cancel" style={{ width: '100%' }} onClick={() => setShowCancelModal(true)}>Cancel Trip</button>
          </div>
        </div>
      </div>

      {/* Map Panel */}
      <div className="trip-map-container">
        <TripMap stops={trip.stops} myRideRequestId={me.rideRequestId} driverLocation={driverLocation} />
      </div>

      <CancelModal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} onConfirm={confirmCancel} />
    </div>
  );
}