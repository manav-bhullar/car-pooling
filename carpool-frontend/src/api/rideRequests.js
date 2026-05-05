const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

function getHeaders(userId) {
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  };
}

export async function createRideRequest(userId, data) {
  const res = await fetch(`${BASE_URL}/ride-requests`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!json.success) {
    throw {
      status: res.status,
      message: json.error?.message || 'Create failed',
    };
  }

  return json.data;
}

export async function getRideRequests(userId, status = null) {
  const url = status
    ? `${BASE_URL}/ride-requests?status=${status}`
    : `${BASE_URL}/ride-requests`;

  const res = await fetch(url, {
    headers: getHeaders(userId),
  });

  const json = await res.json();

  if (!json.success) {
    throw {
      status: res.status,
      message: json.error?.message || 'Fetch failed',
    };
  }

  return json.data;
}

export async function cancelRideRequest(userId, rideRequestId) {
  const res = await fetch(
    `${BASE_URL}/ride-requests/${rideRequestId}/cancel`,
    {
      method: 'POST',
      headers: getHeaders(userId),
    }
  );

  const json = await res.json();

  if (!json.success) {
    throw {
      status: res.status,
      message: json.error?.message || 'Cancel failed',
    };
  }

  return json.data;
}