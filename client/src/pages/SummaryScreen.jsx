import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import PassengerList from "../components/PassengerList";
import TripMap from "../components/TripMap";
import { formatTime } from "../utils/time";
import "./SummaryScreen.css";

import { useMemo } from "react";

function Confetti() {
  // Generate random confetti pieces only once
  const pieces = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 3}s`,
        background:
          i % 2 === 0 ? "var(--color-md-primary)" : "var(--color-md-tertiary)",
      })),
    [],
  );

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
    dispatch({ type: "RESET" });
  }

  const trip = state.trip;
  const me = (trip?.passengers || []).find((p) => p.userId === user?.id) || {};

  const displayDistance =
    typeof me.distanceKm === "number" && me.distanceKm > 0
      ? me.distanceKm
      : trip?.totalDistanceKm || 0;

  const soloFare = displayDistance * 12; // Generic solo rate 12/km
  const savings = soloFare - (me.fareShare || 0);

  return (
    <div className="summary-screen-expressive">
      {/* Map Panel (Full Bleed Wallpaper) */}
      <div className="summary-map-container">
        <TripMap stops={trip?.stops} myRideRequestId={me.rideRequestId} />
      </div>

      <Confetti />

      <div className="summary-content-layer">
        <div className="summary-glass-card">
          <div className="summary-completion-mark">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h1 className="summary-title">Trip Complete</h1>
          {trip?.completedAt && (
            <p className="summary-time">
              Completed at {formatTime(trip.completedAt)}
            </p>
          )}

          <div className="summary-stats-card glass-card">
            <div style={{ textAlign: "center" }}>
              <p className="summary-stats-fare-label">Your Fare</p>
              <h2 className="summary-stats-fare-value">
                ₹{me.fareShare?.toFixed(0) || "0"}
              </h2>
            </div>

            {savings > 0 && (
              <div className="summary-stats-savings">
                <span className="summary-stats-savings-label">
                  Value Unlocked
                </span>
                <span className="summary-stats-savings-value">
                  You saved ₹{savings.toFixed(0)}
                </span>
                <span className="summary-stats-savings-subtext">
                  compared to a solo ride
                </span>
              </div>
            )}

            <div className="summary-stats-row">
              <div>
                <p className="summary-stats-row-label">Distance</p>
                <p className="summary-stats-row-value">
                  {displayDistance?.toFixed(2)} km
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="summary-stats-row-label">Duration</p>
                <p className="summary-stats-row-value">
                  {trip?.estimatedEtaMinutes || 0} min
                </p>
              </div>
            </div>

            <div style={{ textAlign: "left" }}>
              <PassengerList
                passengers={trip?.passengers}
                currentUserId={user?.id}
              />
            </div>
          </div>

          <button
            className="btn fab-extended summary-fab"
            onClick={handleGoHome}
          >
            Book a New Ride
          </button>
        </div>
      </div>
    </div>
  );
}
