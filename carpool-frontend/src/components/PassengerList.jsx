export default function PassengerList({ passengers = [], currentUserId }) {
  return (
    <div className="passenger-list">
      <p className="passenger-list-label">Co-riders</p>
      {passengers
        .filter(p => p.userId !== currentUserId)
        .map(p => (
          <div key={p.userId} className="passenger-item">
            <span className="passenger-name">{p.name || 'Rider'}</span>
          </div>
        ))
      }
    </div>
  );
}