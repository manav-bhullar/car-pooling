import React from 'react';

export default function CancelModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Cancel your matched ride?</h3>
        <p>Cancelling your matched ride will also cancel the trip for your co-riders. They will be placed back in the queue. Are you sure?</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirm Cancel</button>
        </div>
      </div>
    </div>
  );
}
