import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SEEDED_USERS } from '../constants/users';
import './UserSelectorScreen.css';

function LogoMark({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="wordmark-icon"
    >
      <path d="M9 9h6v6H9z" />
      <path d="M9 9a3 3 0 1 1-3 3v-3h3z" />
      <path d="M15 9a3 3 0 1 0 3 3v-3h-3z" />
      <path d="M15 15a3 3 0 1 1 3-3v3h-3z" />
      <path d="M9 15a3 3 0 1 0-3-3v3h3z" />
    </svg>
  );
}

function StarBadge() {
  return (
    <div className="avatar-badge" />
  );
}

function ProfileCard({ profile, isSelected, tabIndex, onSelect, onKeyDown, btnRef }) {
  const firstName = profile.name.split(' ')[0];
  const imgUrl = `/avatars/${firstName.toLowerCase()}.png`;

  return (
    <div className={`profile-card${isSelected ? ' profile-card--selected' : ''}`}>
      <div className="profile-card__avatar-container">
        <img src={imgUrl} alt={profile.name} className="profile-card__avatar" />
        <StarBadge />
      </div>

      <div className="profile-card__info">
        <span className="profile-card__name">{profile.name}</span>
      </div>

      <button
        ref={btnRef}
        type="button"
        className="profile-card__btn"
        aria-label={`Continue as ${profile.name}`}
        aria-pressed={isSelected}
        tabIndex={tabIndex}
        onClick={() => onSelect(profile)}
        onKeyDown={onKeyDown}
      >
        Select {firstName}
      </button>
    </div>
  );
}

export default function UserSelectorScreen() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const btnRefs = useRef([]);

  const handleKeyDown = useCallback((e, index) => {
    const total = SEEDED_USERS.length;
    let next;
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); next = (index + 1) % total; break;
      case 'ArrowLeft': e.preventDefault(); next = (index - 1 + total) % total; break;
      default: return;
    }
    setFocusedIndex(next);
    btnRefs.current[next]?.focus();
  }, []);

  function handleSelect(profile) {
    if (selectedId) return;
    setSelectedId(profile.id);
    setTimeout(() => {
      dispatch({ type: 'SELECT_USER', payload: profile });
      navigate('/home');
    }, 300);
  }

  return (
    <>
      <div className="screen-root-selector">
        <div className="selector-header-zone">
          <div className="wordmark-row">
            <LogoMark size={24} />
            <span className="wordmark-text">University Rides</span>
          </div>

          <h1 className="panel-title">Select a Profile</h1>
          <p className="panel-subtitle">Choose your identity for this trip</p>
        </div>

        <div className="profile-selection-grid" role="group" aria-label="Select a user profile to continue">
          {SEEDED_USERS.map((profile, index) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isSelected={selectedId === profile.id}
              tabIndex={focusedIndex === index ? 0 : -1}
              btnRef={(el) => { btnRefs.current[index] = el; }}
              onSelect={handleSelect}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>
      </div>
    </>
  );
}