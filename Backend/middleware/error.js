const mongoose = require('mongoose');
const { ApiError } = require('../utils/asyncHandler');
const Book = require('../models/Book');

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found.' });
};

const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Something went wrong on our side. Please try again.';

  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'That record id is not valid.';
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('. ');
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with that ${field} already exists.`;
  } else if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    status = 400;
    message = 'The request body contains invalid JSON.';
  } else if (err.name === 'MulterError') {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large. Maximum size is 5MB.'
        : `Upload error: ${err.message}`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session is invalid or has expired. Please sign in again.';
  }

  if (status >= 500) {
    console.error(`[500] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({ success: false, message });
};

/**
 * Loads a book and verifies it belongs to the authenticated user.
 * Returns 404 (not 403) so users cannot probe for other users' book ids.
 */
const getOwnedBook = async (req) => {
  const book = await Book.findOne({ _id: req.params.id || req.params.bookId, userId: req.user.id });
  if (!book) throw new ApiError(404, 'eBook not found or you do not have access to it.');
  return book;
};

module.exports = { notFound, errorHandler, getOwnedBook };
