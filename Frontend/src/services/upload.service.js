import api from '../lib/api';

export const uploadCover = async (file) => {
  const form = new FormData();
  form.append('cover', file);
  const { data } = await api.post('/upload/cover', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
};
