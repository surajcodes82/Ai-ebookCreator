require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

const configuredOrigins = process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173';
const allowedOrigins = `${configuredOrigins},https://ai-ebook-creator-chi.vercel.app`
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// In development Vite picks whichever port is free (5173, 5174, ...), so any
// localhost/127.0.0.1 origin is accepted. Production still relies on CLIENT_URL.
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
const isLocalOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / curl / server-to-server requests (no Origin header)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        (isDev && isLocalOrigin(origin))
      ) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// Uploaded cover images are served statically.
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), { maxAge: '7d', dotfiles: 'ignore' })
);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    storage: process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
