import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SEEDED_USERS } from '../constants/users';
import './UserSelectorScreen.css';

function ProfileCard({ profile, isSelected, tabIndex, onSelect, onKeyDown, btnRef, index }) {
  const firstName = profile.name.split(' ')[0];
  const imgUrl = `/avatars/${firstName.toLowerCase()}.png`;

  return (
    <button
      ref={btnRef}
      className={`profile-selection-card${isSelected ? ' profile-selection-card--selected' : ''}`}
      aria-label={`Continue as ${profile.name}`}
      aria-pressed={isSelected}
      tabIndex={tabIndex}
      onClick={() => onSelect(profile)}
      onKeyDown={onKeyDown}
      style={{ '--i': index }}
    >
      <div className="profile-selection-avatar-container">
        <img src={imgUrl} alt="" className="profile-selection-avatar" />
      </div>
      <span className="profile-selection-name">{profile.name}</span>
    </button>
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
    // Let spring animation play out
    setTimeout(() => {
      dispatch({ type: 'SELECT_USER', payload: profile });
      navigate('/home');
    }, 400); 
  }

  return (
    <div className="screen-root-selector">
      {/* 3 M3 Expressive Blur Shapes */}
      <div className="blur-shape selector-blur-1"></div>
      <div className="blur-shape selector-blur-2"></div>
      <div className="blur-shape selector-blur-3"></div>

      <div className="selector-header-zone">
        <h1 className="selector-title">Select a Profile</h1>
      </div>

      <div className="profile-selection-grid" role="group" aria-label="Select a user profile to continue">
        {SEEDED_USERS.map((profile, index) => (
          <ProfileCard
            key={profile.id}
            index={index}
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
  );
}