import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import RideRequestForm from '../components/RideRequestForm';
import TripMap from '../components/TripMap';
import 'leaflet/dist/leaflet.css';
import './HomeScreen.css';

export default function HomeScreen() {
  const { state } = useApp();
  const { user } = useAuth();
  const [activeStop, setActiveStop] = useState([]);

  // University coordinates as default wallpaper center
  const defaultCenter = [49.2606, -123.2460]; // e.g., UBC

  const handleLocationSelect = (type, loc) => {
    if (loc) {
      // We only store the single most recently interacted location.
      // This forces the map to fly specifically to this location and NOT draw a line yet.
      setActiveStop([{ stopOrder: type === 'PICKUP' ? 1 : 2, type, lat: loc.lat, lng: loc.lng }]);
    } else {
      setActiveStop([]);
    }
  };

  // Shift the map's visual center to the right on desktop so the route isn't covered by the Glass Card
  const fitBoundsOptions = useMemo(() => ({
    paddingTopLeft: window.innerWidth >= 768 ? [600, 150] : [100, 100],
    paddingBottomRight: [100, 150]
  }), []);

  return (
    <div className="home-screen-expressive">
      {/* Background Wallpaper Map */}
      <div className="home-map-layer">
        <TripMap 
          stops={activeStop} 
          defaultCenter={defaultCenter} 
          fitBoundsOptions={fitBoundsOptions} 
        />
      </div>

      {/* Atmospheric Blur Shapes */}
      <div className="blur-shape home-blur-1"></div>
      <div className="blur-shape home-blur-2"></div>

      {/* Foreground Content */}
      <div className="home-content-layer">
        <div className="home-glass-card glass-card">
          <h1 className="home-headline">Where to next, {user?.name}?</h1>
          <RideRequestForm onLocationSelect={handleLocationSelect} />
        </div>
      </div>
    </div>
  );
}