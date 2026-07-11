import { useEffect, useRef } from "react";

export default function CancelModal({ isOpen, onClose, onConfirm }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;

      const modalElement = modalRef.current;
      if (modalElement) {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
        } else if (e.key === "Tab") {
          if (!modalElement) return;

          const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
        aria-describedby="cancel-modal-desc"
      >
        <h3 id="cancel-modal-title">Cancel your matched ride?</h3>
        <p id="cancel-modal-desc">
          Cancelling your matched ride will also cancel the trip for your
          co-riders. They will be placed back in the queue. Are you sure?
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
