import { useApp } from '../context/AppContext';
import TripCard from '../components/TripCard';
import { formatTime } from '../utils/time';

export default function SummaryScreen() {
  const { state, dispatch } = useApp();

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