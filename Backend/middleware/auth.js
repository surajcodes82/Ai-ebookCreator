const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, ApiError } = require('../utils/asyncHandler');

const JWT_SECRET = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured in the environment.');
  }
  return process.env.JWT_SECRET;
};

const signToken = (userId) =>
  jwt.sign({ id: userId.toString() }, JWT_SECRET(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please sign in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET());
  } catch (err) {
    throw new ApiError(401, 'Your session is invalid or has expired. Please sign in again.');
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw new ApiError(401, 'This account no longer exists. Please sign in again.');
  }

  req.user = { id: user._id.toString(), name: user.name, email: user.email };
  next();
});

module.exports = { requireAuth, signToken, JWT_SECRET };
