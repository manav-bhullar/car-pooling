import PassengerList from './PassengerList';
import StopList from './StopList';
import FareBadge from './FareBadge';
import { formatETA } from '../utils/time';

export default function TripCard({ trip, currentUserId }) {
  return (
    <div className="trip-card">

      <div className="trip-card-header">
        <span className="trip-status">{trip.status}</span>
        <span className="trip-distance">{trip.totalDistanceKm?.toFixed(2)} km</span>
      </div>

      <div className="trip-card-eta">
        <p className="trip-eta-label">Estimated time</p>
        <p className="trip-eta-value">{formatETA(trip.estimatedEtaMinutes)}</p>
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