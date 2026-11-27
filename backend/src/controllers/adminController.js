const Ticket = require('../models/Ticket');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const countBy = async (field, allValues) => {
  const rows = await Ticket.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  const map = Object.fromEntries(allValues.map((v) => [v, 0]));
  rows.forEach((r) => { map[r._id] = r.count; });
  return map;
};

exports.stats = asyncHandler(async (_req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, createdLast7Days, resolvedLast7Days, byStatus, byPriority, byCategory] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ createdAt: { $gte: weekAgo } }),
    Ticket.countDocuments({ resolvedAt: { $gte: weekAgo } }),
    countBy('status', Ticket.STATUSES),
    countBy('priority', Ticket.PRIORITIES),
    countBy('category', Ticket.CATEGORIES),
  ]);
  res.json({ success: true, data: { total, createdLast7Days, resolvedLast7Days, byStatus, byPriority, byCategory } });
});

exports.users = asyncHandler(async (_req, res) => {
  const data = await User.find().sort('name').select('name email role createdAt');
  res.json({ success: true, data });
});
