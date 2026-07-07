export default function StopList({ stops = [] }) {
  const sorted = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);

  return (
    <div className="stop-list">
      <p className="stop-list-label">Route</p>
      {sorted.map((stop, index) => (
        <div key={index} className="stop-item">
          <span className={`stop-type stop-type--${stop.type.toLowerCase()}`}>
            {stop.type === "PICKUP" ? "▲ Pickup" : "▼ Drop"}
          </span>
          <span className="stop-coords">
            {stop.address ?? `${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`}
          </span>
        </div>
      ))}
    </div>
  );
}
