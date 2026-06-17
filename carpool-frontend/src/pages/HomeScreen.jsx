import { useApp } from '../context/AppContext';
import RideRequestForm from '../components/RideRequestForm';
import './HomeScreen.css';

export default function HomeScreen() {
  const { state } = useApp();

  return (
    <div className="home-screen">
      {/* MD3 Organic blur shapes */}
      <div className="home-blur-shape-1" aria-hidden="true" />
      <div className="home-blur-shape-2" aria-hidden="true" />

      <div className="user-info">
        <p className="welcome-message">Welcome, {state.userName}!</p>
      </div>
      <RideRequestForm />
    </div>
  );
}