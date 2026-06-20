import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableTrips, acceptTrip, getCurrentTrip } from '../api/driver';
import { useAuth } from '../context/AuthContext';
import DriverMap from '../components/DriverMap';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTripId, setExpandedTripId] = useState(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

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

  const expandedTrip = trips.find(t => t.id === expandedTripId);
  const mapStops = expandedTrip ? expandedTrip.tripStops : [];
  
  // If no trip is expanded, show all initial pickup points
  const pickupMarkers = !expandedTrip ? trips.map(t => {
    const firstPickup = t.tripStops.find(s => s.type === 'PICKUP');
    return firstPickup ? { lat: firstPickup.lat, lng: firstPickup.lng, id: t.id } : null;
  }).filter(Boolean) : [];

  return (
    <>
      <DriverMap stops={mapStops} pickupMarkers={pickupMarkers} defaultCenter={[37.7749, -122.4194]} />
      
      {/* Top Right Header */}
      <div className="glass-panel" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 20, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderRadius: '50px' }}>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ color: 'white', fontSize: '1rem', margin: 0 }}>Driver Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>{user?.name}</p>
        </div>
        <button className="btn btn-danger" style={{ width: 'auto', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.875rem' }} onClick={logout}>Logout</button>
      </div>

      {/* Left Panel for Trips */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', bottom: '1.5rem', width: '400px', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: 'white', marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Available Trips</h2>
        
        {error && <div style={{ color: '#EF4444', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}

        {trips.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No trips available right now. Waiting for riders...
            <br /><br />
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={loadTrips}>Refresh</button>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {trips.map(trip => {
              const isExpanded = expandedTripId === trip.id;
              return (
                <div 
                  key={trip.id} 
                  className="glass-panel trip-card" 
                  style={{ marginBottom: '1.5rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                >
                  <div className="trip-header">
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Trip ID: {trip.id.slice(-6)}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{trip.tripUsers?.length || 0} Riders</span>
                  </div>
                  
                  <div className="trip-stats" style={{ marginBottom: isExpanded ? '1.5rem' : '0' }}>
                    <div className="stat">
                      <div className="stat-value">{trip.estimatedEtaMinutes}</div>
                      <div className="stat-label">mins</div>
                    </div>
                    <div className="stat">
                      <div className="stat-value">{trip.totalDistanceKm?.toFixed(1)}</div>
                      <div className="stat-label">km</div>
                    </div>
                    <div className="stat" style={{ gridColumn: 'span 2' }}>
                      <div className="stat-value" style={{ color: '#FBBF24' }}>
                        ₹{(trip.tripUsers?.reduce((acc, tu) => acc + tu.fareShare, 0) || 0).toFixed(0)}
                      </div>
                      <div className="stat-label">Total Earnings</div>
                    </div>
                  </div>

                  {!isExpanded && (
                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '500' }}>
                      Tap to view route details & accept
                    </div>
                  )}

                  {isExpanded && (
                    <>
                      <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
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

                      <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleAccept(trip.id); }}>
                        Accept Trip
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
