import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { cancelRideRequest } from '../api/rideRequests';
import { getElapsedSeconds, formatElapsed } from '../utils/time';
import TripMap from '../components/TripMap';
import './WaitingScreen.css';

export default function WaitingScreen() {
  const { state, dispatch } = useApp();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const rideRequest = state.rideRequest;
  const createdAt = rideRequest?.createdAt || null;
  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(createdAt));

  useEffect(() => {
    setElapsed(getElapsedSeconds(createdAt));
    const timer = setInterval(() => {
      setElapsed(getElapsedSeconds(createdAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  async function handleCancel() {
    if (!rideRequest) return;
    setCancelling(true);
    try {
      await cancelRideRequest(state.userId, rideRequest.id);
      dispatch({ type: 'RESET' });
    } catch (err) {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { type: 'error', message: err.message || 'Failed to cancel' },
      });
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  }

  if (!rideRequest) return null;

  const isMatched = state.uiState === 'MATCHED' || rideRequest.status === 'MATCHED';

  const stops = [
    { stopOrder: 1, type: 'PICKUP', lat: rideRequest.pickupLat, lng: rideRequest.pickupLng },
    { stopOrder: 2, type: 'DROPOFF', lat: rideRequest.dropLat, lng: rideRequest.dropLng }
  ];

  return (
    <div className={`waiting-screen-expressive ${isMatched ? 'is-matched' : ''}`}>
      
      {/* Map as Wallpaper */}
      <div className="waiting-map-layer">
        <TripMap stops={stops} />
      </div>

      {/* Atmospheric Blur Shapes */}
      <div className="blur-shape waiting-blur-1"></div>
      <div className="blur-shape waiting-blur-2"></div>

      {/* Foreground Content */}
      <div className="waiting-content-layer">
        <div className="waiting-glass-card glass-card">
          
          <h1 className="waiting-primary-msg">
            {isMatched ? 'Match found!' : 'Finding your ride...'}
          </h1>
          {isMatched && <p className="waiting-secondary-msg">Loading your trip details...</p>}

          <div className="waiting-status-block">
            <p className="waiting-timer">Waiting for {formatElapsed(elapsed)}</p>
          </div>

          <hr className="waiting-divider" />

          <div className="waiting-request-summary">
            <span className="waiting-section-label">Your request</span>
            <p className="waiting-route-text">{rideRequest.pickupAddress?.split(',')[0]} → {rideRequest.dropAddress?.split(',')[0]}</p>
            <p className="waiting-time-text">
              {rideRequest.preferredTime
                ? new Date(rideRequest.preferredTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'ASAP'}
            </p>
          </div>

          {/* Cancel Action */}
          <div className="waiting-cancel-zone">
            {!showCancelConfirm ? (
              <button 
                className="btn btn-outlined btn-danger" 
                onClick={() => setShowCancelConfirm(true)}
                disabled={isMatched || cancelling}
              >
                Cancel ride
              </button>
            ) : (
              <div className="cancel-confirm-inline">
                <p>Are you sure?</p>
                <div className="cancel-confirm-actions">
                  <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                    {cancelling ? 'Cancelling...' : 'Yes, cancel'}
                  </button>
                  <button className="btn btn-tonal" onClick={() => setShowCancelConfirm(false)} disabled={cancelling}>
                    Keep searching
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
