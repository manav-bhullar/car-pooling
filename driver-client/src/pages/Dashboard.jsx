import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableTrips, acceptTrip, getCurrentTrip } from '../api/driver';
import { useAuth } from '../context/AuthContext';
import DriverMap from '../components/DriverMap';
import { useCompassHeading } from '../hooks/useCompassHeading';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [rejectedTripIds, setRejectedTripIds] = useState([]);
  const [isExpanded, setIsExpanded] = useState(window.innerWidth >= 768);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [idleDriverLocation, setIdleDriverLocation] = useState(null);
  const gpsWatchRef = useRef(null);
  const { heading: compassHeading, requestPermission, permissionState } = useCompassHeading();

  // Watch GPS for the idle car icon on the map
  useEffect(() => {
    if (!navigator.geolocation) return;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => setIdleDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => {
      if (gpsWatchRef.current != null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsExpanded(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check if we already have an active trip
    getCurrentTrip()
      .then(trip => {
        if (trip) {
          navigate('/active-trip');
        } else {
          loadTrips();
        }
      })
      .catch(() => loadTrips());
  }, [navigate]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await getAvailableTrips();
      setTrips(data);
    } catch (err) {
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (tripId) => {
    try {
      await acceptTrip(tripId);
      navigate('/active-trip');
    } catch (err) {
      alert(err.message || 'Failed to accept trip');
      loadTrips(); // Reload available trips
    }
  };

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading trips...</div>;
  }

  const displayTrips = trips.filter(t => !rejectedTripIds.includes(t.id));
  const expandedTrip = displayTrips.find(t => t.id === expandedTripId);
  const mapStops = expandedTrip ? expandedTrip.tripStops : [];
  
  // If no trip is expanded, show all initial pickup points
  const pickupMarkers = !expandedTrip ? displayTrips.map(t => {
    const firstPickup = t.tripStops.find(s => s.type === 'PICKUP');
    return firstPickup ? { lat: firstPickup.lat, lng: firstPickup.lng, id: t.id } : null;
  }).filter(Boolean) : [];

  return (
    <>
      <DriverMap stops={mapStops} pickupMarkers={pickupMarkers} defaultCenter={[30.9010, 75.8573]} idleDriverLocation={idleDriverLocation} compassHeading={compassHeading} />
      
      {/* Compass permission prompt — only shows on iOS before user taps */}
      {permissionState === 'prompt' && (
        <button
          onClick={requestPermission}
          title="Enable compass for live direction"
          style={{
            position: 'fixed',
            bottom: '6rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '50px',
            background: 'var(--color-md-surface)',
            border: '1px solid var(--color-md-outline)',
            boxShadow: 'var(--shadow-elevation-2)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#0A56D1',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-80q-100 0-170-70t-70-170q0-100 70-170t170-70q100 0 170 70t70 170q0 100-70 170t-170 70Zm0-80q66 0 113-47t47-113q0-66-47-113t-113-47q-66 0-113 47t-47 113q0 66 47 113t113 47Z"/>
          </svg>
          Enable compass direction
        </button>
      )}

      {/* Top Right Header */}
      <div className="glass-panel" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 20, padding: '6px 6px 6px 12px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '50px', background: 'var(--color-md-surface-container-low)', border: '1px solid var(--color-md-outline-variant)', boxShadow: 'var(--shadow-elevation-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-md-primary-container)', color: 'var(--color-md-on-primary-container)', fontSize: '0.875rem', fontWeight: 700 }}>
          {user?.name?.charAt(0).toUpperCase() || 'D'}
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '4px' }}>{user?.name}</span>
        <button onClick={() => setShowLogoutModal(true)} className="logout-btn" title="Logout" aria-label="Logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* Left Panel for Trips (Bottom Sheet on Mobile) */}
      <div className={`driver-panel glass-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Drag Handle to toggle expansion on mobile */}
        <div className="drag-handle-wrapper" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="drag-handle"></div>
        </div>

        <div onClick={() => !isExpanded && setIsExpanded(true)} style={{ cursor: !isExpanded ? 'pointer' : 'default' }}>
          <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>
            {displayTrips.length === 0 ? 'Searching for riders...' : `Available Trips (${displayTrips.length})`}
          </h2>
        </div>
        
        {error && <div style={{ color: '#EF4444', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}

        <div className="panel-scroll-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {displayTrips.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No trips available right now. Waiting for riders...
              <br /><br />
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={loadTrips}>Refresh</button>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {displayTrips.map(trip => {
              const isExpanded = expandedTripId === trip.id;
              const firstPickup = trip.tripStops.find(s => s.type === 'PICKUP');
              const lastDropoff = [...trip.tripStops].reverse().find(s => s.type === 'DROPOFF');

              return (
                <div 
                  key={trip.id} 
                  className="glass-panel trip-card" 
                  style={{ marginBottom: '1.5rem', cursor: 'pointer', transition: 'all 0.3s ease', background: 'var(--color-md-surface)' }}
                  onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                >
                  <div className="trip-header">
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{trip.estimatedEtaMinutes} min away • {trip.totalDistanceKm?.toFixed(1)} km</span>
                    <span style={{ color: '#0A56D1', fontWeight: 'bold' }}>{trip.tripUsers?.length || 0} Riders</span>
                  </div>
                  
                  {!isExpanded && (
                    <div style={{ margin: '0.5rem 0 1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0A56D1' }}></div>
                        {firstPickup?.rideRequest?.pickupAddress || 'Start Location'}
                      </div>
                      <div style={{ width: '2px', height: '10px', background: 'var(--border-color)', margin: '2px 0 2px 3px' }}></div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #B3261E' }}></div>
                        {lastDropoff?.rideRequest?.dropAddress || 'End Location'}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isExpanded ? '1rem' : '0' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      ₹{(trip.tripUsers?.reduce((acc, tu) => acc + tu.fareShare, 0) || 0).toFixed(0)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>Total Earnings</span>
                    </div>
                    {!isExpanded && (
                      <span style={{ fontSize: '0.75rem', color: '#0A56D1', fontWeight: '600', background: 'rgba(10, 86, 209, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        Tap to expand
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <>
                      <div style={{ marginBottom: '1.5rem', background: 'var(--color-md-surface-container)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Riders</h4>
                        {trip.tripUsers?.map((tu, i) => (
                          <div key={tu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                            <span>{tu.user?.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{tu.user?.phone || 'No phone'}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Route Stops</h4>
                        <div className="stop-list" style={{ marginTop: '0', marginBottom: '0' }}>
                          {trip.tripStops?.map((stop) => (
                            <div key={stop.id} className={`stop-item ${stop.type.toLowerCase()}`} style={{ paddingBottom: '1rem' }}>
                              <div className="stop-marker" style={{ width: '8px', height: '8px', left: '-18px', top: '6px' }}></div>
                              <div className="stop-type" style={{ fontSize: '0.65rem' }}>{stop.type} - Rider {trip.tripUsers.findIndex(tu => tu.rideRequestId === stop.rideRequestId) + 1}</div>
                              <div className="stop-address" style={{ fontSize: '0.8rem' }}>{stop.rideRequest?.[stop.type === 'PICKUP' ? 'pickupAddress' : 'dropAddress'] || 'Unknown Address'}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-cancel" style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border-color)' }} onClick={(e) => { 
                          e.stopPropagation(); 
                          setRejectedTripIds(prev => [...prev, trip.id]);
                          if (expandedTripId === trip.id) setExpandedTripId(null);
                        }}>
                          Decline
                        </button>
                        <button className="btn btn-primary" style={{ flex: 2, padding: '0.75rem' }} onClick={(e) => { e.stopPropagation(); handleAccept(trip.id); }}>
                          Accept Trip
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {showLogoutModal && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal glass-card">
            <h3>Sign Out</h3>
            <p>Are you sure you want to sign out of your account?</p>
            <div className="logout-modal-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={() => { setShowLogoutModal(false); logout(); }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
