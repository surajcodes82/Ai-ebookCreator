const { asyncHandler, ApiError } = require('../utils/asyncHandler');
const { storeCover } = require('../services/storage');

// POST /api/upload/cover  (multipart field name: "cover")
const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Please choose an image to upload.');
  const url = await storeCover(req.file);
  if (!url) throw new ApiError(500, 'The image could not be stored. Please try again.');
  res.status(201).json({ success: true, message: 'Cover image uploaded.', url });
});

module.exports = { uploadCover };
