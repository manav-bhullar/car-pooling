export default function PassengerList({ passengers = [], currentUserId }) {
  const others = passengers.filter((p) => p.userId !== currentUserId);
  if (others.length === 0)
    return (
      <p
        style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}
      >
        No co-riders yet.
      </p>
    );

  return (
    <div
      className="passenger-list"
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      <p
        className="passenger-list-label"
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          margin: "0 0 4px 0",
          fontWeight: 600,
        }}
      >
        Co-riders
      </p>
      {others.map((p) => {
        const firstName = p.name ? p.name.split(" ")[0] : "Rider";
        return (
          <div
            key={p.userId}
            className="passenger-item"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "var(--color-md-surface)",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--color-md-primary-container)",
                color: "var(--color-md-on-primary-container)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span className="passenger-name" style={{ fontWeight: 500 }}>
              {firstName}
            </span>
          </div>
        );
      })}
    </div>
  );
}
