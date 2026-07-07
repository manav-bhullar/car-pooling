import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import PassengerList from '../components/PassengerList';
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

  const trip = state.trip;
  const me = (trip?.passengers || []).find(p => p.userId === user?.id) || {};
  
  const displayDistance = typeof me.distanceKm === 'number' && me.distanceKm > 0
    ? me.distanceKm
    : (trip?.totalDistanceKm || 0);

  const soloFare = displayDistance * 12; // Generic solo rate 12/km
  const savings = soloFare - (me.fareShare || 0);

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
        {trip?.completedAt && (
          <p className="summary-time">
            Completed at {formatTime(trip.completedAt)}
          </p>
        )}

        <div className="summary-stats-card glass-card" style={{ padding: '32px', borderRadius: '24px', background: 'var(--color-md-surface-container)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>Your Fare</p>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--color-md-on-surface)', margin: 0, lineHeight: 1 }}>₹{me.fareShare?.toFixed(0) || '0'}</h2>
          </div>

          {savings > 0 && (
             <div style={{ background: 'var(--color-md-primary-container)', color: 'var(--color-md-on-primary-container)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>Value Unlocked</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>You saved ₹{savings.toFixed(0)}</span>
                <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>compared to a solo ride</span>
             </div>
          )}

          <div style={{ background: 'var(--color-md-surface)', borderRadius: '12px', padding: '16px', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
             <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Distance</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{displayDistance?.toFixed(2)} km</p>
             </div>
             <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Duration</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{trip?.estimatedEtaMinutes || 0} min</p>
             </div>
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <PassengerList passengers={trip?.passengers} currentUserId={user?.id} />
          </div>

        </div>

        <button className="fab-extended summary-fab" onClick={handleGoHome}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Book a New Ride
        </button>
      </div>
    </div>
  );
}