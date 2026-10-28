const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Book = require('../models/Book');
const { asyncHandler, ApiError } = require('../utils/asyncHandler');
const { requireFields, requireEmail, requirePassword, cleanString } = require('../utils/validate');
const { signToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password']);

  const name = cleanString(req.body.name, 80);
  if (name.length < 2) throw new ApiError(400, 'Name must be at least 2 characters long.');

  const email = requireEmail(req.body.email);
  const password = requirePassword(req.body.password);

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with that email already exists. Please sign in instead.');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashed });
  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user: user.toJSON(),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);

  const email = requireEmail(req.body.email);
  const password = String(req.body.password);

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Incorrect email or password.');

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) throw new ApiError(401, 'Incorrect email or password.');

  const token = signToken(user._id);
  res.json({ success: true, message: 'Signed in successfully.', token, user: user.toJSON() });
});

const publicUser = async (user) => {
  const bookCount = await Book.countDocuments({ userId: user._id });
  return { ...user.toJSON(), bookCount };
};

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'This account no longer exists.');
  res.json({ success: true, user: await publicUser(user) });
});

// GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'This account no longer exists.');
  res.json({ success: true, user: await publicUser(user) });
});

// PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'This account no longer exists.');

  const updates = {};

  if (req.body.name !== undefined) {
    const name = cleanString(req.body.name, 80);
    if (name.length < 2) throw new ApiError(400, 'Name must be at least 2 characters long.');
    updates.name = name;
  }

  if (req.body.email !== undefined) {
    const email = requireEmail(req.body.email);
    if (email !== user.email) {
      const duplicate = await User.findOne({ email });
      if (duplicate) throw new ApiError(409, 'That email is already in use by another account.');
    }
    updates.email = email;
  }

  if (!Object.keys(updates).length) {
    throw new ApiError(400, 'Provide at least one field to update.');
  }

  Object.assign(user, updates);
  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: await publicUser(user),
  });
});

module.exports = { register, login, me, getProfile, updateProfile };
