const path = require('path');
const fs = require('fs');
const { UPLOAD_DIR } = require('../middleware/upload');

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

let cloudinary = null;
if (hasCloudinary) {
  // Lazy require so the app runs fine when Cloudinary is not configured.
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const isLocalUrl = (url) => typeof url === 'string' && url.startsWith('/uploads/');

/**
 * Persists an uploaded cover image.
 * Uses Cloudinary when configured, otherwise keeps the file in /server/uploads.
 * Always returns a publicly usable URL (or path).
 */
const storeCover = async (file) => {
  if (!file) return '';
  if (hasCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'ai-ebook-creator/covers',
        resource_type: 'image',
      });
      fs.unlink(file.path, () => {});
      return result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to local storage:', err.message);
      // fall through to local storage so the user's upload is never lost
    }
  }
  return `/uploads/${file.filename}`;
};

/** Removes a stored cover (local file or Cloudinary asset). Failures are non-fatal. */
const removeCover = async (url) => {
  if (!url) return;
  try {
    if (isLocalUrl(url)) {
      const filePath = path.join(UPLOAD_DIR, path.basename(url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return;
    }
    if (cloudinary && /res\.cloudinary\.com/.test(url)) {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+(?:[?#]|$)/);
      if (match) await cloudinary.uploader.destroy(match[1]);
    }
  } catch (err) {
    console.error('Failed to remove cover image:', err.message);
  }
};

module.exports = { storeCover, removeCover, hasCloudinary, isLocalUrl };
