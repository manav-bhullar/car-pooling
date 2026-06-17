import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';
import { formatTime } from '../utils/time';
import './SummaryScreen.css';

function Confetti() {
  // Generate random confetti pieces
  const pieces = Array.from({ length: 20 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 2}s`,
    animationDuration: `${2 + Math.random() * 3}s`,
    background: i % 2 === 0 ? 'var(--color-md-primary)' : 'var(--color-md-tertiary)'
  }));

  return (
    <div className="confetti-container">
      {pieces.map((style, i) => (
        <div key={i} className="confetti-piece" style={style} />
      ))}
    </div>
  );
}

export default function SummaryScreen() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();

  function handleGoHome() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="summary-screen-expressive">
      {/* 3 Active Blur Shapes */}
      <div className="blur-shape summary-blur-1"></div>
      <div className="blur-shape summary-blur-2"></div>
      <div className="blur-shape summary-blur-3"></div>

      <Confetti />

      <div className="summary-content-layer">
        <div className="summary-completion-mark">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 className="summary-title">Trip Complete</h1>
        {state.trip?.completedAt && (
          <p className="summary-time">
            Completed at {formatTime(state.trip.completedAt)}
          </p>
        )}

        <div className="summary-stats-card card">
          {state.trip && (
            <TripCard
              trip={state.trip}
              currentUserId={user?.id}
            />
          )}
        </div>

        <button className="fab-extended summary-fab" onClick={handleGoHome}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Book Again
        </button>
      </div>
    </div>
  );
}