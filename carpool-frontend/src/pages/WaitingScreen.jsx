import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useRideRequestPoller } from '../hooks/useRideRequestPoller';
import LoadingState from '../components/LoadingState';
import { formatElapsed } from '../utils/time';

export default function WaitingScreen() {
  const { state } = useApp();
  // eslint-disable-next-line react-hooks/purity
  const startTimeRef = useRef(Date.now());

  useRideRequestPoller();

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!state.rideRequest) {
    return <LoadingState message="Preparing your request..." />;
  }

  return (
    <div className="waiting-screen">
      <LoadingState message="Finding you a ride..." />
      <p className="waiting-time">Waiting for {formatElapsed(Math.floor(elapsed / 1000))}</p>
      <p className="waiting-hint">We'll match you with compatible riders soon</p>
    </div>
  );
}