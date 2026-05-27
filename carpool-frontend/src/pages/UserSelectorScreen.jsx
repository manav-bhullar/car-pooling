import { useApp } from '../context/AppContext';
import { SEEDED_USERS } from '../constants/users';

export default function UserSelectorScreen() {
  const { dispatch } = useApp();

  function handleSelectUser(user) {
    dispatch({ type: 'SELECT_USER', payload: user });
  }

  return (
    <div className="user-selector-screen">
      <h1 className="app-title">Carpool App</h1>
      <p className="select-prompt">Select your user to continue</p>
      <div className="user-list">
        {SEEDED_USERS.map(user => (
          <button
            key={user.id}
            className="user-button"
            onClick={() => handleSelectUser(user)}
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  );
}