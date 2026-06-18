import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import './TopNav.css';

export default function TopNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);

  if (!isAuthenticated) return null;

  const authRoutes = ['/login', '/register', '/verify-email'];
  if (authRoutes.includes(location.pathname)) return null;

  return (
    <>
      <div className="top-nav">
      <div className="user-profile glass-card">
        <div className="user-avatar">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="user-name">{user?.name}</span>
        <button onClick={() => setShowModal(true)} className="logout-btn" title="Logout" aria-label="Logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>

      {showModal && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal glass-card">
            <h3>Sign Out</h3>
            <p>Are you sure you want to sign out of your account?</p>
            <div className="logout-modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={() => { setShowModal(false); logout(); }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
