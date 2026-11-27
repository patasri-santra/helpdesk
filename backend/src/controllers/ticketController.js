const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { emit, EVENTS } = require('../events/eventBus');
const { getAccessibleTicket, actorOf } = require('../services/ticketAccess');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const USER_EDITABLE = ['title', 'description', 'category', 'priority'];
const ADMIN_EDITABLE = ['status', 'priority'];

exports.list = asyncHandler(async (req, res) => {
  const { status, priority, category, createdBy, search, page, limit, sort } = req.query;
  const isAdmin = req.user.role === 'ADMIN';

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (isAdmin) {
    if (createdBy) filter.createdBy = createdBy;
  } else {
    filter.createdBy = req.user._id;
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const [data, total] = await Promise.all([
    Ticket.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email'),
    Ticket.countDocuments(filter),
  ]);

  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

exports.create = asyncHandler(async (req, res) => {
  const ticket = await Ticket.create({ ...req.body, createdBy: req.user._id });
  emit(EVENTS.TICKET_CREATED, {
    ticketId: ticket._id, title: ticket.title, ownerId: ticket.createdBy,
    actor: actorOf(req.user), meta: { priority: ticket.priority, category: ticket.category },
  });
  res.status(201).json({ success: true, data: ticket });
});

exports.getOne = asyncHandler(async (req, res) => {
  const { ticket } = await getAccessibleTicket(req.params.id, req.user);
  await ticket.populate('createdBy', 'name email');
  res.json({ success: true, data: ticket });
});

exports.update = asyncHandler(async (req, res) => {
  const { ticket } = await getAccessibleTicket(req.params.id, req.user);
  const isAdmin = req.user.role === 'ADMIN';
  const body = req.body;

  const allowed = isAdmin ? ADMIN_EDITABLE : USER_EDITABLE;
  const forbidden = Object.keys(body).filter((k) => !allowed.includes(k));
  if (forbidden.length) {
    throw ApiError.forbidden(
      isAdmin
        ? `Admins can only change ${ADMIN_EDITABLE.join(' and ')}`
        : `Only admins can change: ${forbidden.join(', ')}`
    );
  }
  if (!isAdmin && ticket.status !== 'OPEN') {
    throw ApiError.forbidden('Tickets can only be edited while they are open');
  }

  const before = ticket.toObject();
  const changedFields = Object.keys(body).filter((k) => body[k] !== before[k]);
  if (!changedFields.length) return res.json({ success: true, data: ticket });

  changedFields.forEach((k) => { ticket[k] = body[k]; });
  const statusChanged = changedFields.includes('status');
  if (statusChanged) ticket.resolvedAt = ticket.status === 'RESOLVED' ? new Date() : undefined;
  await ticket.save();

  const base = {
    ticketId: ticket._id, title: ticket.title, ownerId: ticket.createdBy, actor: actorOf(req.user),
  };
  const otherFields = changedFields.filter((k) => k !== 'status');
  if (otherFields.length) emit(EVENTS.TICKET_UPDATED, { ...base, meta: { fields: otherFields } });
  if (statusChanged) {
    emit(EVENTS.STATUS_CHANGED, { ...base, meta: { from: before.status, to: ticket.status } });
    if (ticket.status === 'RESOLVED') emit(EVENTS.TICKET_RESOLVED, { ...base, meta: {} });
  }

  res.json({ success: true, data: ticket });
});

exports.remove = asyncHandler(async (req, res) => {
  const { ticket } = await getAccessibleTicket(req.params.id, req.user);
  if (req.user.role !== 'ADMIN' && ticket.status !== 'OPEN') {
    throw ApiError.forbidden('Tickets can only be deleted while they are open');
  }
  await Promise.all([ticket.deleteOne(), Comment.deleteMany({ ticket: ticket._id })]);
  emit(EVENTS.TICKET_DELETED, {
    ticketId: ticket._id, title: ticket.title, ownerId: ticket.createdBy, actor: actorOf(req.user), meta: {},
  });
  res.json({ success: true, message: 'Ticket deleted' });
});
