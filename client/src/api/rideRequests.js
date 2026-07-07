import { apiClient } from "./apiClient";

// Note: userId is kept in the signature for backward compatibility with calling components,
// but it is no longer used for headers. The backend extracts it from the JWT access token.

export async function createRideRequest(userId, data) {
  const res = await apiClient.fetch(`/ride-requests`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!json.success)
    throw {
      status: res.status,
      message: json.error?.message || "Create failed",
    };
  return json.data;
}

export async function getRideRequests(userId, status = null) {
  const url = status ? `/ride-requests?status=${status}` : `/ride-requests`;

  const res = await apiClient.fetch(url);

  const json = await res.json();
  if (!json.success)
    throw {
      status: res.status,
      message: json.error?.message || "Fetch failed",
    };
  return json.data;
}

export async function getCurrentRideRequest(userId) {
  const res = await apiClient.fetch(`/ride-requests/current`);

  const json = await res.json();
  if (!json.success)
    throw {
      status: res.status,
      message: json.error?.message || "Fetch failed",
    };
  return json.data;
}

export async function cancelRideRequest(userId, rideRequestId) {
  const res = await apiClient.fetch(`/ride-requests/${rideRequestId}/cancel`, {
    method: "POST",
  });

  const json = await res.json();
  if (!json.success)
    throw {
      status: res.status,
      message: json.error?.message || "Cancel failed",
    };
  return json.data;
}
