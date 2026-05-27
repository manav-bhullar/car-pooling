import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { createRideRequest } from '../api/rideRequests';

export default function RideRequestForm() {
  const { state, dispatch } = useApp();

  const getDefaultTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    pickupLat: '',
    pickupLng: '',
    dropoffLat: '',
    dropoffLng: '',
    preferredTime: getDefaultTime(),
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const data = {
      pickupLat: parseFloat(formData.pickupLat),
      pickupLng: parseFloat(formData.pickupLng),
      dropLat: parseFloat(formData.dropoffLat),
      dropLng: parseFloat(formData.dropoffLng),
      preferredTime: new Date(formData.preferredTime).toISOString(),
    };

    if (Object.values(data).slice(0, 4).some(v => isNaN(v))) {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { type: 'error', message: 'Please enter valid coordinates' }
      });
      return;
    }

    try {
      const rideRequest = await createRideRequest(state.userId, data);
      dispatch({ type: 'SET_RIDE_REQUEST', payload: rideRequest });
    } catch {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { type: 'error', message: 'Failed to create ride request. Please try again.' }
      });
    }
  }

  return (
    <form className="ride-request-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Request a Ride</h2>

      <div className="form-group">
        <label className="form-label">Pickup Location</label>
        <div className="coord-inputs">
          <input
            type="number"
            step="0.0001"
            name="pickupLat"
            placeholder="Latitude"
            value={formData.pickupLat}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            step="0.0001"
            name="pickupLng"
            placeholder="Longitude"
            value={formData.pickupLng}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Dropoff Location</label>
        <div className="coord-inputs">
          <input
            type="number"
            step="0.0001"
            name="dropoffLat"
            placeholder="Latitude"
            value={formData.dropoffLat}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            step="0.0001"
            name="dropoffLng"
            placeholder="Longitude"
            value={formData.dropoffLng}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Preferred Time</label>
        <input
          type="datetime-local"
          name="preferredTime"
          value={formData.preferredTime}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="submit-button">
        Request Ride
      </button>
    </form>
  );
}