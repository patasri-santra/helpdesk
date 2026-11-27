const Ticket = require('../models/Ticket');
const ApiError = require('../utils/ApiError');

async function getAccessibleTicket(id, user) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  const isOwner = String(ticket.createdBy) === String(user._id);
  if (user.role !== 'ADMIN' && !isOwner) throw ApiError.notFound('Ticket not found');
  return { ticket, isOwner };
}

const actorOf = (user) => ({ id: user._id, name: user.name, role: user.role });

module.exports = { getAccessibleTicket, actorOf };
