export default function CancelModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Cancel trip</h3>
        <p>Your co-riders will be returned to the queue.</p>
        <div className="modal-actions">
          <button className="btn btn-tonal" onClick={onClose}>Close</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirm Cancel</button>
        </div>
      </div>
    </div>
  );
}
