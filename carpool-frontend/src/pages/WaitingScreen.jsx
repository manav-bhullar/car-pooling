import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { cancelRideRequest } from '../api/rideRequests';
import LoadingState from '../components/LoadingState';
import CancelButton from '../components/CancelButton';
import { getElapsedSeconds, formatElapsed } from '../utils/time';
import './WaitingScreen.css';

export default function WaitingScreen() {
  const { state, dispatch } = useApp();
  const [cancelling, setCancelling] = useState(false);

  // Elapsed seconds since ride request creation. Use rideRequest.createdAt
  // so the timer survives navigation and reflects server timestamp.
  const createdAt = state.rideRequest?.createdAt || null;
  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(createdAt));

  useEffect(() => {
    setElapsed(getElapsedSeconds(createdAt));
    const timer = setInterval(() => {
      setElapsed(getElapsedSeconds(createdAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  async function handleCancel() {
    if (!state.rideRequest) return;

    setCancelling(true);
    try {
      await cancelRideRequest(state.userId, state.rideRequest.id);
      dispatch({ type: 'RESET' });
    } catch (err) {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: {
          type: 'error',
          message: err.message || 'Failed to cancel ride request',
        },
      });
    } finally {
      setCancelling(false);
    }
  }

  if (!state.rideRequest) {
    return <LoadingState message="Preparing your request..." />;
  }

  const pendingCycles = state.rideRequest?.pendingCycles;

  function getProgressMessage(seconds) {
    if (seconds < 10) return "Finding the best matches near you...";
    if (seconds < 60) return "Still searching — thanks for your patience.";
    if (seconds < 120) return "This may take slightly longer; expanding search.";
    if (seconds < 240) return "We're extending search radius and retrying.";
    return "Thanks for waiting — we're still working on finding matches.";
  }

  return (
    <div className="waiting-screen">
      {/* MD3 Organic blur shapes */}
      <div className="waiting-blur-shape-1" aria-hidden="true" />
      <div className="waiting-blur-shape-2" aria-hidden="true" />

      <LoadingState message="Finding you a ride..." />

      <p className="waiting-time">Waiting for {formatElapsed(elapsed)}</p>

      {typeof pendingCycles === 'number' && (
        <p className="waiting-cycles">Attempt {pendingCycles + 1}</p>
      )}

      <p className="waiting-hint" aria-live="polite">{getProgressMessage(elapsed)}</p>

      <CancelButton onCancel={handleCancel} label={cancelling ? 'Cancelling...' : 'Cancel Ride'} />
    </div>
  );
}
