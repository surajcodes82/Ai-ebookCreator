const Book = require('../models/Book');
const { asyncHandler, ApiError } = require('../utils/asyncHandler');
const { requireFields, cleanString, isPlainObject } = require('../utils/validate');
const { getOwnedBook } = require('../middleware/error');
const { removeCover } = require('../services/storage');
const { buildBookPdf } = require('../services/pdf');
const { buildBookDocx } = require('../services/docx');
const { WRITING_STYLES } = require('../utils/constants');

const slugify = (value) =>
  String(value || 'ebook')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'ebook';

const pickBookFields = (body) => {
  const updates = {};
  if (body.title !== undefined) {
    const title = cleanString(body.title, 200);
    if (!title) throw new ApiError(400, 'Book title cannot be empty.');
    updates.title = title;
  }
  if (body.subtitle !== undefined) updates.subtitle = cleanString(body.subtitle, 300);
  if (body.author !== undefined) updates.author = cleanString(body.author, 120);
  if (body.topic !== undefined) updates.topic = cleanString(body.topic, 500);
  if (body.coverImage !== undefined) updates.coverImage = cleanString(body.coverImage, 1000);
  if (body.style !== undefined) {
    if (!WRITING_STYLES.includes(body.style)) {
      throw new ApiError(400, 'Please choose a valid writing style.');
    }
    updates.style = body.style;
  }
  return updates;
};

// GET /api/books
const listBooks = asyncHandler(async (req, res) => {
  const books = await Book.find({ userId: req.user.id }).sort({ updatedAt: -1 }).select(
    'title subtitle author coverImage style topic chapters createdAt updatedAt'
  );

  res.json({
    success: true,
    books: books.map((book) => ({
      ...book.toObject(),
      chapterCount: book.chapters.length,
      chapters: undefined,
    })),
  });
});

// GET /api/books/:id
const getBook = asyncHandler(async (req, res) => {
  const book = await getOwnedBook(req);
  res.json({ success: true, book });
});

// POST /api/books
const createBook = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title']);

  const title = cleanString(req.body.title, 200);
  if (!title) throw new ApiError(400, 'Book title is required.');

  let chapters = [];
  if (req.body.chapters !== undefined) {
    if (!Array.isArray(req.body.chapters)) throw new ApiError(400, 'Chapters must be an array.');
    chapters = req.body.chapters.map((chapter, index) => {
      if (!isPlainObject(chapter)) throw new ApiError(400, 'Each chapter must be an object.');
      const chapterTitle = cleanString(chapter.title, 200);
      if (!chapterTitle) throw new ApiError(400, `Chapter ${index + 1} needs a title.`);
      return {
        title: chapterTitle,
        description: cleanString(chapter.description, 1000),
        content: cleanString(chapter.content, 200000),
        order: index,
      };
    });
  }

  const book = await Book.create({
    userId: req.user.id,
    title,
    subtitle: cleanString(req.body.subtitle, 300),
    author: cleanString(req.body.author, 120) || req.user.name || '',
    coverImage: cleanString(req.body.coverImage, 1000),
    style: WRITING_STYLES.includes(req.body.style) ? req.body.style : 'Informative',
    topic: cleanString(req.body.topic, 500),
    chapters,
  });

  res.status(201).json({ success: true, message: 'eBook created successfully.', book });
});

// PUT /api/books/:id
const updateBook = asyncHandler(async (req, res) => {
  const book = await getOwnedBook(req);
  const updates = pickBookFields(req.body);

  if (!Object.keys(updates).length) throw new ApiError(400, 'No valid fields provided to update.');

  const previousCover = book.coverImage;
  Object.assign(book, updates);
  await book.save();

  // Remove the old stored image once a new cover has replaced it.
  if (updates.coverImage !== undefined && previousCover && previousCover !== updates.coverImage) {
    await removeCover(previousCover);
  }

  res.json({ success: true, message: 'eBook updated successfully.', book });
});

// DELETE /api/books/:id
const deleteBook = asyncHandler(async (req, res) => {
  const book = await getOwnedBook(req);
  await removeCover(book.coverImage);
  await book.deleteOne();
  res.json({ success: true, message: 'eBook deleted successfully.' });
});

// POST /api/books/:bookId/chapters
const addChapter = asyncHandler(async (req, res) => {
  const book = await getOwnedBook(req);

  const title = cleanString(req.body.title, 200) || `Chapter ${book.chapters.length + 1}`;
  const insertAt = Number.isInteger(req.body.order)
    ? Math.min(Math.max(req.body.order, 0), book.chapters.length)
    : book.chapters.length;

  book.chapters.splice(insertAt, 0, {
    title,
    description: cleanString(req.body.description, 1000),
    content: cleanString(req.body.content, 200000),
    order: insertAt,
  });
  book.chapters.forEach((chapter, index) => {
    chapter.order = index;
  });

  await book.save();
  res.status(201).json({
    success: true,
    message: 'Chapter added.',
    book,
    chapterId: book.chapters[insertAt]._id,
  });
});

// PUT /api/books/:bookId/chapters/:chapterId
const updateChapter = asyncHandler(async (req, res) => {
  const book = await getOwnedBook(req);
  const chapter = book.chapters.id(req.params.chapterId);
  if (!chapter) throw new ApiError(404, 'Chapter not found in this eBook.');

  if (req.body.title !== undefined) {
    const title = cleanString(req.body.title, 200);
    if (!title) throw new ApiError(400, 'Chapter title cannot be empty.');
    chapter.title = title;
  }
  if (req.body.description !== undefined) chapter.description = cleanString(req.body.description, 1000);
  if (req.body.content !== undefined) chapter.content = cleanString(req.body.content, 400000);
  if (req.body.order !== undefined && Number.isInteger(req.body.order)) chapter.order = req.body.order;

  await book.save();
  res.json({ success: true, message: 'Chapter saved.', book, chapterId: chapter._id });
});

// DELETE /api/books/:bookId/chapters/:chapterId
const deleteChapter = asyncHandler(async (req, res) => {
  const book = await getOwnedBook(req);
  const chapter = book.chapters.id(req.params.chapterId);
  if (!chapter) throw new ApiError(404, 'Chapter not found in this eBook.');

  chapter.deleteOne();
  book.chapters.forEach((item, index) => {
    item.order = index;
  });

  await book.save();
  res.json({ success: true, message: 'Chapter deleted.', book });
});

// PUT /api/books/:bookId/chapters/reorder
const reorderChapters = asyncHandler(async (req, res) => {
  const book = await getOwnedBook(req);

  const ids = Array.isArray(req.body.chapterIds) ? req.body.chapterIds.map(String) : null;
  if (!ids || !ids.length) throw new ApiError(400, 'chapterIds must be a non-empty array.');
  if (ids.length !== book.chapters.length) {
    throw new ApiError(400, 'chapterIds must include every chapter exactly once.');
  }

  const existingIds = book.chapters.map((chapter) => chapter._id.toString());
  const unique = new Set(ids);
  if (unique.size !== ids.length || ids.some((id) => !existingIds.includes(id))) {
    throw new ApiError(400, 'chapterIds does not match the chapters of this eBook.');
  }

  const ordered = ids.map((id) => book.chapters.id(id));
  book.chapters = ordered;
  book.chapters.forEach((chapter, index) => {
    chapter.order = index;
  });

  await book.save();
  res.json({ success: true, message: 'Chapter order saved.', book });
});

const sendExport = (res, buffer, filename, contentType) => {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );
  res.end(buffer);
};

// GET /api/books/:id/export/pdf
const exportPdf = asyncHandler(async (req, res) => {
  const book = await getOwnedBook(req);
  const buffer = await buildBookPdf(book.toObject());
  sendExport(res, buffer, `${slugify(book.title)}.pdf`, 'application/pdf');
});

// GET /api/books/:id/export/docx
const exportDocx = asyncHandler(async (req, res) => {
  const book = await getOwnedBook(req);
  const buffer = await buildBookDocx(book.toObject());
  sendExport(
    res,
    buffer,
    `${slugify(book.title)}.docx`,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
});

module.exports = {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  addChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  exportPdf,
  exportDocx,
};
