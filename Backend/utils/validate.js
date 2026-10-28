const { ApiError } = require('../utils/asyncHandler');

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Asserts that the request body contains the given keys with usable values.
 * Throws a 400 ApiError listing every missing/invalid field at once.
 */
const requireFields = (body, fields) => {
  const errors = [];
  if (!isPlainObject(body)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }
  fields.forEach((field) => {
    const value = body[field];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  if (errors.length) throw new ApiError(400, errors.join('. '));
};

const requireEmail = (email) => {
  const value = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    throw new ApiError(400, 'Please provide a valid email address.');
  }
  return value.toLowerCase();
};

const requirePassword = (password) => {
  const value = String(password || '');
  if (value.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long.');
  }
  if (value.length > 128) {
    throw new ApiError(400, 'Password must be 128 characters or fewer.');
  }
  return value;
};

const cleanString = (value, maxLength = 300) =>
  String(value === undefined || value === null ? '' : value)
    .replace(/\r\n/g, '\n')
    .slice(0, maxLength);

module.exports = { requireFields, requireEmail, requirePassword, cleanString, isPlainObject };
