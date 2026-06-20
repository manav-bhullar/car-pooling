import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTrip, startTrip, completeTrip } from '../api/driver';
import { useGPSSimulator } from '../hooks/useGPSSimulator';
import { useAuth } from '../context/AuthContext';
import DriverMap from '../components/DriverMap';

export default function ActiveTrip() {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadTrip();
  }, []);

  const loadTrip = async () => {
    try {
      const data = await getCurrentTrip();
      if (!data) {
        navigate('/'); // No active trip, go back to dashboard
        return;
      }
      setTrip(data);
    } catch (err) {
      setError('Failed to load active trip');
    } finally {
      setLoading(false);
    }
  };

  const isStarted = trip?.status === 'STARTED';
  const location = useGPSSimulator(trip?.id, trip?.tripStops, isStarted);

  const handleStart = async () => {
    try {
      await startTrip(trip.id);
      loadTrip(); // Reload to update status
    } catch (err) {
      alert(err.message || 'Failed to start trip');
    }
  };

  const handleCompleteClick = () => {
    setShowCompleteModal(true);
  };

  const handleCompleteConfirm = async () => {
    try {
      setShowCompleteModal(false);
      await completeTrip(trip.id);
      navigate('/'); // Back to dashboard
    } catch (err) {
      alert(err.message || 'Failed to complete trip');
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading active trip...</div>;
  if (error) return <div style={{ color: '#EF4444', textAlign: 'center', padding: '2rem' }}>{error}</div>;
  if (!trip) return null;

  return (
    <>
      <DriverMap stops={trip.tripStops} defaultCenter={[37.7749, -122.4194]} driverLocation={location} />
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', bottom: '1.5rem', width: '400px', zIndex: 10, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '0.5rem' }}>
        <div className="header glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'var(--color-md-surface)' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 600 }}>Active Trip</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Trip ID: {trip.id.slice(-6)}</p>
          </div>
          {isStarted ? (
            <button className="btn btn-success" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleCompleteClick} disabled={loading}>
              {loading ? 'Completing...' : 'Complete Trip'}
            </button>
          ) : (
            <button className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleStart} disabled={loading}>
              {loading ? 'Starting...' : 'Start Trip'}
            </button>
          )}
        </div>

        {error && <div style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</div>}

        {isStarted && location && (
          <div className="glass-panel pulse" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid #0A56D1', display: 'flex', justifyContent: 'space-between', background: 'var(--color-md-surface)' }}>
            <div>
              <span style={{ color: '#0A56D1', fontWeight: '600', display: 'block', fontSize: '0.875rem' }}>Live GPS Broadcasting Active</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
              </span>
            </div>
            <svg style={{ transform: `rotate(${location.bearing}deg)`, transition: 'transform 0.5s linear', fill: '#0A56D1', width: '24px', height: '24px' }} viewBox="0 0 24 24">
              <path d="M12 2L4 20l1.5 1.5L12 17l6.5 4.5L20 20 12 2z" />
            </svg>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--color-md-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontWeight: 600 }}>Riders</h3>
            <span style={{ color: '#0A56D1', fontWeight: 'bold' }}>₹{(trip.tripUsers?.reduce((acc, tu) => acc + tu.fareShare, 0) || 0).toFixed(0)} Earnings</span>
          </div>
          {trip.tripUsers?.map((tu, i) => (
            <div key={tu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--color-md-surface-container)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '500' }}>{tu.user?.name} (Rider {i + 1})</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{tu.user?.phone || 'No phone'}</span>
              </div>
              <div style={{ color: '#0A56D1', fontWeight: '600' }}>₹{tu.fareShare.toFixed(0)}</div>
            </div>
          ))}
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--color-md-surface)' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Route Stops</h3>
          <div className="stop-list">
            {trip.tripStops.map((stop) => (
              <div key={stop.id} className={`stop-item ${stop.type.toLowerCase()}`}>
                <div className="stop-marker"></div>
                <div className="stop-type">{stop.type} - Rider {trip.tripUsers?.findIndex(tu => tu.rideRequestId === stop.rideRequestId) + 1}</div>
                <div className="stop-address">{stop.rideRequest?.[stop.type === 'PICKUP' ? 'pickupAddress' : 'dropAddress'] || 'Unknown Address'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCompleteModal && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal glass-card">
            <h3>Complete Trip</h3>
            <p>Are you sure you have dropped off all riders and want to complete this trip?</p>
            <div className="logout-modal-actions">
              <button className="btn-cancel" onClick={() => setShowCompleteModal(false)}>Cancel</button>
              <button className="btn btn-success" style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', font: 'var(--type-label-medium)', fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={handleCompleteConfirm}>Complete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
