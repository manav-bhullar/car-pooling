import api from './axios';

export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data.data;
};

export const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  return data.data;
};

export const logout = async () => {
  const { data } = await api.post('/auth/logout');
  return data.data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.data;
};
