const express = require('express');
const {
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
} = require('../controllers/bookController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listBooks);
router.post('/', createBook);

// Export routes must be declared before "/:id" is harmless, but keep them above
// the chapter routes so ids are never ambiguous.
router.get('/:id/export/pdf', exportPdf);
router.get('/:id/export/docx', exportDocx);

router.get('/:id', getBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

router.post('/:bookId/chapters', addChapter);
router.put('/:bookId/chapters/reorder', reorderChapters);
router.put('/:bookId/chapters/:chapterId', updateChapter);
router.delete('/:bookId/chapters/:chapterId', deleteChapter);

module.exports = router;
