import api from '../lib/api';

export const getProfile = async () => {
  const { data } = await api.get('/users/profile');
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put('/users/profile', payload);
  return data;
};
