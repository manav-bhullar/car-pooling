import { useApp } from '../context/AppContext';
import RideRequestForm from '../components/RideRequestForm';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './HomeScreen.css';

export default function HomeScreen() {
  const { state } = useApp();

  // University coordinates as default wallpaper center
  const defaultCenter = [49.2606, -123.2460]; // e.g., UBC

  return (
    <div className="home-screen-expressive">
      {/* Background Wallpaper Map */}
      <div className="home-map-layer">
        <MapContainer center={defaultCenter} zoom={14} scrollWheelZoom={false} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>

      {/* Atmospheric Blur Shapes */}
      <div className="blur-shape home-blur-1"></div>
      <div className="blur-shape home-blur-2"></div>

      {/* Foreground Content */}
      <div className="home-content-layer">
        <div className="home-glass-card glass-card">
          <h1 className="home-headline">Where to next, {state.userName}?</h1>
          <RideRequestForm />
        </div>
      </div>
    </div>
  );
}