const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');
const { getAccessibleTicket } = require('../services/ticketAccess');

exports.forTicket = asyncHandler(async (req, res) => {
  const { ticket } = await getAccessibleTicket(req.params.id, req.user);
  const data = await ActivityLog.find({ ticket: ticket._id }).sort('createdAt').populate('actor', 'name role');
  res.json({ success: true, data });
});

exports.recent = asyncHandler(async (_req, res) => {
  const data = await ActivityLog.find().sort('-createdAt').limit(50).populate('actor', 'name role');
  res.json({ success: true, data });
});
