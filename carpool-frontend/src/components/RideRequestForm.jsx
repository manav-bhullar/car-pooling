import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { createRideRequest, getRideRequests } from '../api/rideRequests';
import { searchLocation, reverseGeocode } from '../api/geocoding';

function LocationInput({ label, value, onSelect, allowCurrentLocation }) {
  const [query, setQuery] = useState(value?.displayName || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const latestQueryRef = useRef('');

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
    latestQueryRef.current = val;
    setOpen(true);

    if (value?.displayName && val !== value.displayName) {
      onSelect(null);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (val.trim().length < 3) {
      setResults([]);
      // Keep open if allowCurrentLocation so the button stays visible
      if (!allowCurrentLocation || val.trim().length > 0) {
        setOpen(false);
      }
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchLocation(val);
        if (latestQueryRef.current === val) {
          setResults(found);
        }
      } catch {
        if (latestQueryRef.current === val) {
          setResults([]);
        }
      } finally {
        if (latestQueryRef.current === val) {
          setLoading(false);
        }
      }
    }, 600);
  }

  function handleSelect(place) {
    setQuery(place.displayName);
    setResults([]);
    setOpen(false);
    onSelect(place);
  }

  function handleCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setQuery('Locating...');
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (place) {
          handleSelect(place);
        } else {
          setQuery('');
          alert('Could not determine your address.');
        }
      } catch (err) {
        setQuery('');
        alert('Error fetching location.');
      } finally {
        setLoading(false);
      }
    }, () => {
      setLoading(false);
      setQuery('');
      alert('Unable to retrieve your location.');
    });
  }

  return (
    <div className="location-input-wrapper" ref={wrapperRef}>
      <div className="md3-input-group" style={{ position: 'relative' }}>
        <label className="md3-label">{label}</label>
        <input
          className="md3-input"
          style={allowCurrentLocation ? { paddingRight: '48px' } : {}}
          type="text"
          placeholder="Search for a location..."
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {allowCurrentLocation && (
          <button
            type="button"
            onClick={handleCurrentLocation}
            title="Use current location"
            style={{
              position: 'absolute',
              right: '12px',
              bottom: '28px', // Center relative to the 56px tall input
              transform: 'translateY(50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0A56D1'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q0-33-56.5-23.5T400-480q0 33 23.5 56.5T480-400Z"/>
            </svg>
          </button>
        )}
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
        allowCurrentLocation={true}
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
