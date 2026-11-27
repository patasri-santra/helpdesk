const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { emit, EVENTS } = require('../events/eventBus');
const { getAccessibleTicket, actorOf } = require('../services/ticketAccess');

exports.list = asyncHandler(async (req, res) => {
  const { ticket } = await getAccessibleTicket(req.params.id, req.user);
  const data = await Comment.find({ ticket: ticket._id }).sort('createdAt').populate('author', 'name role');
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const { ticket } = await getAccessibleTicket(req.params.id, req.user);
  if (ticket.status === 'CLOSED' && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('This ticket is closed. Open a new ticket to continue.');
  }

  const comment = await Comment.create({
    ticket: ticket._id, author: req.user._id, authorRole: req.user.role, body: req.body.body,
  });
  await comment.populate('author', 'name role');

  emit(EVENTS.COMMENT_ADDED, {
    ticketId: ticket._id, title: ticket.title, ownerId: ticket.createdBy,
    actor: actorOf(req.user), meta: { commentId: comment._id },
  });
  res.status(201).json({ success: true, data: comment });
});
