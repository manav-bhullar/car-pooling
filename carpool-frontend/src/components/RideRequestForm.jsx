import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { createRideRequest, getRideRequests } from '../api/rideRequests';
import { searchLocation } from '../api/geocoding';

function LocationInput({ label, value, onSelect }) {
  const [query, setQuery] = useState(value?.displayName || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value?.displayName || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);

    if (value?.displayName && val !== value.displayName) {
      onSelect(null);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (val.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchLocation(val);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(place) {
    setQuery(place.displayName);
    setResults([]);
    setOpen(false);
    onSelect(place);
  }

  return (
    <div className="location-input-wrapper" ref={wrapperRef}>
      <div className="md3-input-group">
        <label className="md3-label">{label}</label>
        <input
          className="md3-input"
          type="text"
          placeholder="Search for a location..."
          value={query}
          onChange={handleChange}
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="location-dropdown">
          {loading && (
            <div className="location-dropdown-item location-loading">
              Searching...
            </div>
          )}

          {!loading && query.trim().length >= 3 && results.length === 0 && (
            <div className="location-dropdown-item location-empty">
              No results found
            </div>
          )}

          {!loading && results.map((place, index) => (
            <button
              key={index}
              type="button"
              className="location-dropdown-item"
              onClick={() => handleSelect(place)}
            >
              {place.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RideRequestForm({ onLocationSelect }) {
  const { state, dispatch } = useApp();

  const getDefaultTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [preferredTime, setPreferredTime] = useState(getDefaultTime());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePickupSelect = (loc) => {
    setPickup(loc);
    if (onLocationSelect) onLocationSelect('PICKUP', loc);
  };

  const handleDropSelect = (loc) => {
    setDrop(loc);
    if (onLocationSelect) onLocationSelect('DROPOFF', loc);
  };

  function validate() {
    if (!pickup) return 'Please select a pickup location';
    if (!drop) return 'Please select a drop location';
    if (!preferredTime) return 'Please select a preferred time';

    if (pickup.lat === drop.lat && pickup.lng === drop.lng) {
      return 'Pickup and drop cannot be the same location';
    }

    const prefTime = new Date(preferredTime);
    if (prefTime < new Date(Date.now() - 5 * 60 * 1000)) {
      return 'Preferred time cannot be in the past';
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const rideRequest = await createRideRequest(state.userId, {
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropLat: drop.lat,
        dropLng: drop.lng,
        pickupAddress: pickup.displayName,
        dropAddress: drop.displayName,
        preferredTime: new Date(preferredTime).toISOString(),
      });
      dispatch({ type: 'SET_RIDE_REQUEST', payload: rideRequest });
    } catch (err) {
      if (err.status === 409) {
        const requests = await getRideRequests(state.userId, 'PENDING');
        if (requests.length > 0) {
          dispatch({ type: 'SET_RIDE_REQUEST', payload: requests[0] });
          dispatch({
            type: 'SET_NOTIFICATION',
            payload: {
              type: 'info',
              message: 'You already have an active ride request.',
            },
          });
          setLoading(false);
          return;
        }
      }

      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!pickup && !!drop && !!preferredTime && !loading;

  return (
    <form className="ride-request-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Request a Ride</h2>

      <LocationInput
        label="Pickup location"
        value={pickup}
        onSelect={handlePickupSelect}
      />

      <LocationInput
        label="Drop location"
        value={drop}
        onSelect={handleDropSelect}
      />

      <div className="md3-input-group">
        <label className="md3-label">Preferred Time</label>
        <input
          className="md3-input"
          type="datetime-local"
          value={preferredTime}
          onChange={e => setPreferredTime(e.target.value)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button
        type="submit"
        className="fab-extended"
        style={{ width: '100%', marginTop: '16px' }}
        disabled={!canSubmit}
      >
        {loading ? 'Finding your ride...' : 'Request Ride'}
      </button>
    </form>
  );
}
