const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict('Email is already registered');

  const user = await User.create({ name, email, password, role: 'USER' });
  res.status(201).json({ success: true, token: signToken(user), user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password');
  res.json({ success: true, token: signToken(user), user });
});

exports.me = (req, res) => res.json({ success: true, user: req.user });
