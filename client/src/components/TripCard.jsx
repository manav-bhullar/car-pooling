import PassengerList from './PassengerList';
import StopList from './StopList';
import FareBadge from './FareBadge';
import { formatETA } from '../utils/time';

export default function TripCard({ trip, currentUserId }) {
  const me = (trip.passengers || []).find(p => p.userId === currentUserId) || {};

  const displayDistance = typeof me.distanceKm === 'number' && me.distanceKm > 0
    ? `${me.distanceKm.toFixed(2)} km`
    : trip.totalDistanceKm?.toFixed(2) ? `${trip.totalDistanceKm.toFixed(2)} km` : '--';

  const displayEtaMinutes = typeof me.etaMinutes === 'number' && me.etaMinutes >= 0
    ? me.etaMinutes
    : trip.estimatedEtaMinutes;

  return (
    <div className="trip-card">

      <div className="trip-card-header">
        <span className="trip-status">{trip.status}</span>
        <span className="trip-distance">{displayDistance}</span>
      </div>

      <div className="trip-card-eta">
        <p className="trip-eta-label">Estimated time</p>
        <p className="trip-eta-value">{formatETA(displayEtaMinutes)}</p>
      </div>

      <FareBadge fareShare={trip.fareShare} />

      <PassengerList
        passengers={trip.passengers}
        currentUserId={currentUserId}
      />

      <StopList stops={trip.stops} />

    </div>
  );
}