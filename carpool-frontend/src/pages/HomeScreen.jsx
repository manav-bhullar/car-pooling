import { useApp } from '../context/AppContext';
import RideRequestForm from '../components/RideRequestForm';

export default function HomeScreen() {
  const { state } = useApp();

  return (
    <div className="home-screen">
      <div className="user-info">
        <p className="welcome-message">Welcome, {state.userName}!</p>
      </div>
      <RideRequestForm />
    </div>
  );
}