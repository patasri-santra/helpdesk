const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const [data, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(50),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, data, unread });
});

exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, { read: true }, { new: true }
  );
  if (!n) throw ApiError.notFound('Notification not found');
  res.json({ success: true, data: n });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});
