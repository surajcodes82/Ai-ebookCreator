const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { ApiError } = require('../utils/asyncHandler');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname) || '.jpg';
    const name = `cover-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const uploadCover = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new ApiError(400, 'Only JPEG, PNG, WEBP or GIF images are allowed.'));
    }
    cb(null, true);
  },
});

module.exports = { uploadCover, UPLOAD_DIR, ALLOWED_TYPES };
