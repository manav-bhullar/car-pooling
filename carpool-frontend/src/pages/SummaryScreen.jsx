import { useApp } from '../context/AppContext';
import TripCard from '../components/TripCard';
import { formatTime } from '../utils/time';
import './SummaryScreen.css';

export default function SummaryScreen() {
  const { state, dispatch } = useApp();

  function handleGoHome() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="summary-screen">
      {/* MD3 Organic blur shapes — celebratory atmosphere */}
      <div className="summary-blur-shape-1" aria-hidden="true" />
      <div className="summary-blur-shape-2" aria-hidden="true" />
      <div className="summary-blur-shape-3" aria-hidden="true" />

      <div className="summary-header">
        {/* Animated checkmark */}
        <div className="summary-check-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

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