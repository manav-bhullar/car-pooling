import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function StatusBanner() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (!state.notification) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_NOTIFICATION' });
    }, 5000);
    return () => clearTimeout(timer);
  }, [state.notification]);

  if (!state.notification) return null;

  return (
    <div className={`status-banner status-banner--${state.notification.type}`}>
      <p className="status-banner-message">{state.notification.message}</p>
      <button
        className="status-banner-close"
        onClick={() => dispatch({ type: 'CLEAR_NOTIFICATION' })}
      >
        ✕
      </button>
    </div>
  );
}