const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

function getHeaders(userId) {
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  };
}

export async function getTrips(userId) {
  const res = await fetch(`${BASE_URL}/trips`, {
    headers: getHeaders(userId),
  });

  const json = await res.json();

  if (!json.success) {
    throw {
      status: res.status,
      message: json.error?.message || 'Fetch trips failed',
    };
  }

  return json.data;
}

export async function getTripById(userId, tripId) {
  const res = await fetch(`${BASE_URL}/trips/${tripId}`, {
    headers: getHeaders(userId),
  });

  const json = await res.json();

  if (!json.success) {
    throw {
      status: res.status,
      message: json.error?.message || 'Fetch trip failed',
    };
  }

  return json.data;
}

export async function completeTrip(userId, tripId) {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/complete`, {
    method: 'POST',
    headers: getHeaders(userId),
  });

  const json = await res.json();

  if (!json.success) {
    throw {
      status: res.status,
      message: json.error?.message || 'Complete failed',
    };
  }

  return json.data;
}