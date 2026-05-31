import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TripCard from '../components/TripCard';
import { formatTime } from '../utils/time';
import { getTripById } from '../api/trips';

export default function SummaryScreen() {
  const { state, dispatch } = useApp();
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
        // Unauthorized or missing trip → reset and go home
        dispatch({ type: 'RESET' });
        navigate('/', { replace: true });
      }
    }

    fetchTrip();
    return () => { mounted = false; };
  }, [tripId, state.user, state.userId, dispatch, navigate]);

  function handleGoHome() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="summary-screen">

      <div className="summary-header">
        <h1 className="summary-title">Trip Complete</h1>
        {state.trip?.completedAt && (
          <p className="summary-time">
            Completed at {formatTime(state.trip.completedAt)}
          </p>
        )}
      </div>

      {state.trip && (
        <TripCard
          trip={state.trip}
          currentUserId={state.userId}
        />
      )}

      <button
        className="home-button"
        onClick={handleGoHome}
      >
        Back to home
      </button>

    </div>
  );
}