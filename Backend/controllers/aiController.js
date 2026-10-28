const Book = require('../models/Book');
const { asyncHandler, ApiError } = require('../utils/asyncHandler');
const { requireFields, cleanString } = require('../utils/validate');
const { generateOutline, generateChapter } = require('../services/gemini');
const { WRITING_STYLES } = require('../utils/constants');

// POST /api/ai/generate-outline
const outline = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title', 'chapterCount']);

  const title = cleanString(req.body.title, 200);
  const chapterCount = Number(req.body.chapterCount);
  if (!Number.isFinite(chapterCount) || chapterCount < 1 || chapterCount > 30) {
    throw new ApiError(400, 'Number of chapters must be between 1 and 30.');
  }

  const style = WRITING_STYLES.includes(req.body.style) ? req.body.style : 'Informative';
  const chapters = await generateOutline({
    title,
    chapterCount: Math.round(chapterCount),
    topic: cleanString(req.body.topic, 500),
    style,
  });

  res.json({ success: true, chapters });
});

// POST /api/ai/generate-chapter
const chapter = asyncHandler(async (req, res) => {
  let bookTitle = cleanString(req.body.bookTitle, 200);
  let bookSubtitle = cleanString(req.body.bookSubtitle, 300);
  let style = req.body.style;
  let chapterTitle = cleanString(req.body.chapterTitle, 200);
  let chapterDescription = cleanString(req.body.chapterDescription, 1000);
  let existingContent = cleanString(req.body.existingContent, 400000);
  let chapterNumber = Number(req.body.chapterNumber) || 1;
  let totalChapters = Number(req.body.totalChapters) || 1;
  let outline = cleanString(req.body.outline, 6000);

  // Prefer loading the real book so the prompt always matches the database.
  if (req.body.bookId) {
    const book = await Book.findOne({ _id: req.body.bookId, userId: req.user.id });
    if (!book) throw new ApiError(404, 'eBook not found or you do not have access to it.');

    let index = -1;
    if (req.body.chapterId) {
      index = book.chapters.findIndex((item) => item._id.toString() === String(req.body.chapterId));
      if (index === -1) throw new ApiError(404, 'Chapter not found in this eBook.');
    }

    bookTitle = book.title;
    bookSubtitle = book.subtitle;
    style = book.style;
    totalChapters = book.chapters.length || 1;
    outline = book.chapters
      .map((item, i) => `${i + 1}. ${item.title}${item.description ? ` — ${item.description}` : ''}`)
      .join('\n');

    if (index >= 0) {
      const current = book.chapters[index];
      chapterTitle = current.title;
      chapterDescription = current.description;
      chapterNumber = index + 1;
      if (req.body.existingContent === undefined) existingContent = current.content || '';
    }
  }

  requireFields({ chapterTitle }, ['chapterTitle']);

  const content = await generateChapter({
    bookTitle: bookTitle || 'Untitled eBook',
    bookSubtitle,
    chapterTitle,
    chapterDescription,
    chapterNumber: Number.isFinite(chapterNumber) ? chapterNumber : 1,
    totalChapters: Number.isFinite(totalChapters) ? totalChapters : 1,
    existingContent,
    style,
    outline,
  });

  res.json({ success: true, content });
});

module.exports = { outline, chapter };
