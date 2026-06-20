import api from './axios';

export const getAvailableTrips = async () => {
  const { data } = await api.get('/driver/trips/available');
  return data.data;
};

export const getCurrentTrip = async () => {
  const { data } = await api.get('/driver/trips/current');
  return data.data;
};

export const acceptTrip = async (tripId) => {
  const { data } = await api.post(`/driver/trips/${tripId}/accept`);
  return data.data;
};

export const startTrip = async (tripId) => {
  const { data } = await api.post(`/driver/trips/${tripId}/start`);
  return data.data;
};

export const completeTrip = async (tripId) => {
  const { data } = await api.post(`/driver/trips/${tripId}/complete`);
  return data.data;
};
