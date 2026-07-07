export default function CancelButton({ onCancel, label = "Cancel" }) {
  return (
    <button className="cancel-button" onClick={onCancel}>
      {label}
    </button>
  );
}
