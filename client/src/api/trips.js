import { apiClient } from "./apiClient";

// Note: userId is kept in the signature for backward compatibility with calling components,
// but it is no longer used for headers. The backend extracts it from the JWT access token.

export async function getTrips(userId) {
  const res = await apiClient.fetch(`/trips`);

  const json = await res.json();
  if (!json.success)
    throw {
      status: res.status,
      message: json.error?.message || "Fetch trips failed",
    };
  return json.data;
}

export async function getCurrentTrip(userId) {
  const res = await apiClient.fetch(`/trips/current`);

  const json = await res.json();
  if (!json.success)
    throw {
      status: res.status,
      message: json.error?.message || "Fetch trips failed",
    };
  return json.data;
}

export async function getTripById(userId, tripId) {
  const res = await apiClient.fetch(`/trips/${tripId}`);

  const json = await res.json();
  if (!json.success)
    throw {
      status: res.status,
      message: json.error?.message || "Fetch trip failed",
    };
  return json.data;
}

export async function completeTrip(userId, tripId) {
  const res = await apiClient.fetch(`/trips/${tripId}/complete`, {
    method: "POST",
  });

  const json = await res.json();
  if (!json.success)
    throw {
      status: res.status,
      message: json.error?.message || "Complete failed",
    };
  return json.data;
}
