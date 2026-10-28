import api, { API_BASE } from '../lib/api';
import { filenameFromDisposition } from '../lib/utils';

export const listBooks = async () => {
  const { data } = await api.get('/books');
  return data.books || [];
};

export const getBook = async (bookId) => {
  const { data } = await api.get(`/books/${bookId}`);
  return data.book;
};

export const createBook = async (payload) => {
  const { data } = await api.post('/books', payload);
  return data.book;
};

export const updateBook = async (bookId, payload) => {
  const { data } = await api.put(`/books/${bookId}`, payload);
  return data.book;
};

export const deleteBook = async (bookId) => {
  const { data } = await api.delete(`/books/${bookId}`);
  return data;
};

export const addChapter = async (bookId, payload = {}) => {
  const { data } = await api.post(`/books/${bookId}/chapters`, payload);
  return { book: data.book, chapterId: data.chapterId };
};

export const updateChapter = async (bookId, chapterId, payload) => {
  const { data } = await api.put(`/books/${bookId}/chapters/${chapterId}`, payload);
  return { book: data.book, chapterId: data.chapterId };
};

export const deleteChapter = async (bookId, chapterId) => {
  const { data } = await api.delete(`/books/${bookId}/chapters/${chapterId}`);
  return data.book;
};

export const reorderChapters = async (bookId, chapterIds) => {
  const { data } = await api.put(`/books/${bookId}/chapters/reorder`, { chapterIds });
  return data.book;
};

const fetchExport = async (bookId, kind) => {
  const response = await api.get(`/books/${bookId}/export/${kind}`, { responseType: 'blob' });
  return response;
};

export const exportPdf = async (bookId) => {
  const response = await fetchExport(bookId, 'pdf');
  return {
    blob: response.data,
    filename: filenameFromDisposition(response.headers?.['content-disposition'], 'ebook.pdf'),
  };
};

export const exportDocx = async (bookId) => {
  const response = await fetchExport(bookId, 'docx');
  return {
    blob: response.data,
    filename: filenameFromDisposition(
      response.headers?.['content-disposition'],
      'ebook.docx'
    ),
  };
};

export const coverFileUrl = (path) => (path ? `${API_BASE}${path}` : '');
