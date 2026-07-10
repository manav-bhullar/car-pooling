import { apiClient } from "./apiClient";


export async function createRideRequest(data) {
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

export async function getRideRequests(status = null) {
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

export async function getCurrentRideRequest() {
  const res = await apiClient.fetch(`/ride-requests/current`);

  const json = await res.json();
  if (!json.success)
    throw {
      status: res.status,
      message: json.error?.message || "Fetch failed",
    };
  return json.data;
}

export async function cancelRideRequest(rideRequestId) {
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
