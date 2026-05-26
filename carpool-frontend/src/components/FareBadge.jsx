export default function FareBadge({ fareShare }) {
  return (
    <div className="fare-badge">
      <p className="fare-label">Your fare</p>
      <p className="fare-amount">₹{fareShare?.toFixed(2) ?? '--'}</p>
    </div>
  );
}