export default function PassengerList({ passengers = [], currentUserId }) {
  return (
    <div className="passenger-list">
      <p className="passenger-list-label">Co-riders</p>
      {passengers
        .filter(p => p.userId !== currentUserId)
        .map(p => {
          const initial = (p.name || 'R').charAt(0).toUpperCase();
          return (
            <div key={p.userId} className="passenger-item">
              <div className="passenger-avatar" aria-hidden="true">{initial}</div>
              <span className="passenger-name">{p.name || 'Rider'}</span>
            </div>
          );
        })
      }
    </div>
  );
}