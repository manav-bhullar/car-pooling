import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useRideRequestPoller } from '../hooks/useRideRequestPoller';
import { cancelRideRequest } from '../api/rideRequests';
import LoadingState from '../components/LoadingState';
import CancelButton from '../components/CancelButton';
import { formatElapsed } from '../utils/time';

export default function WaitingScreen() {
  const { state, dispatch } = useApp();
  // eslint-disable-next-line react-hooks/purity
  const startTimeRef = useRef(Date.now());

  useRideRequestPoller();

  const [elapsed, setElapsed] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="waiting-screen">
      <LoadingState message="Finding you a ride..." />
      <p className="waiting-time">Waiting for {formatElapsed(Math.floor(elapsed / 1000))}</p>
      <p className="waiting-hint">We'll match you with compatible riders soon</p>
      <CancelButton onCancel={handleCancel} label={cancelling ? 'Cancelling...' : 'Cancel Ride'} />
    </div>
  );
}
