import api from '../lib/api';

export const generateOutline = async (payload) => {
  const { data } = await api.post('/ai/generate-outline', payload);
  return data.chapters || [];
};

export const generateChapter = async (payload) => {
  const { data } = await api.post('/ai/generate-chapter', payload);
  return data.content || '';
};
